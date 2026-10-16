// Equalizador (Configurações → Som): presets, ajustes pelo controle, textos e gráfico.
import eq from '../../shared/equalizer'
import type { EqState, EqStatus } from './lazy-api'

const { BANDS, BAND_LIMIT, EFFECT_MAX, VOLUME_MAX, VOLUME_SAFE, PRESETS, CUSTOM } = eq
export { BANDS }

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

export function applyPreset(state: EqState, id: string): EqState {
  const p = PRESETS.find((x) => x.id === id) ?? PRESETS[0]
  return { on: state.on, preset: p.id, bands: [...p.bands], bass: p.bass, clarity: p.clarity, volume: p.volume }
}

export const FLAT: EqState = applyPreset({ on: true, preset: '', bands: [], bass: 0, clarity: 0, volume: 0 }, PRESETS[0].id)

// X no preset: o próximo da lista (de "Personalizado" volta para o primeiro)
export function nextPreset(id: string): string {
  const i = PRESETS.findIndex((p) => p.id === id)
  return PRESETS[(i + 1) % PRESETS.length].id
}

export const presetLabel = (id: string) => (PRESETS.find((p) => p.id === id) ?? CUSTOM).label

// ↑/↓ numa banda: 1 dB, até ±BAND_LIMIT. No limite devolve o mesmo estado (nada a salvar)
export function stepBand(state: EqState, i: number, dir: 1 | -1): EqState {
  const db = clamp(state.bands[i] + dir, -BAND_LIMIT, BAND_LIMIT)
  if (db === state.bands[i]) return state
  const bands = [...state.bands]
  bands[i] = db
  return { ...state, bands, preset: CUSTOM.id }
}

// ←/→ no Bass Boost, no Clarity (0 a EFFECT_MAX) ou no Volume extra (0 a VOLUME_MAX dB)
export type EffectKey = 'bass' | 'clarity' | 'volume'
export const effectMax = (key: EffectKey) => (key === 'volume' ? VOLUME_MAX : EFFECT_MAX)
export function stepEffect(state: EqState, key: EffectKey, dir: 1 | -1): EqState {
  const v = clamp(state[key] + dir, 0, effectMax(key))
  return v === state[key] ? state : { ...state, [key]: v, preset: CUSTOM.id }
}

export const dbText = (db: number) => (db > 0 ? `+${db}` : String(db))

// Sem limitador (VST fica para outra versão): acima de VOLUME_SAFE as partes altas podem distorcer
export const volumeWarning = (db: number) => (db > VOLUME_SAFE ? `Acima de +${VOLUME_SAFE} dB, as partes mais altas (explosões, batidas) podem distorcer.` : '')

// Pontos da curva no gráfico: bandas espalhadas na largura, +limite em cima e -limite embaixo
export function curvePoints(bands: number[], width: number, height: number) {
  const step = width / bands.length
  return bands.map((db, i) => ({ x: step * (i + 0.5), y: ((BAND_LIMIT - db) / (2 * BAND_LIMIT)) * height }))
}

export function statusText(status: EqStatus): string {
  if (!status.installed) {
    return 'Equalizer APO não encontrado. Ele é grátis e faz o equalizador valer para o Windows inteiro: toque em "Instalar o Equalizer APO". Os ajustes ficam guardados até lá.'
  }
  return status.error
}

// Enquanto instala: os dois passos que o Windows não deixa fazer pelo controle
export const INSTALL_WAIT = 'Baixando e instalando... Quando o Windows perguntar, clique em Sim (com o mouse ou o teclado). Depois, na janela do Equalizer APO, marque a sua saída de som e clique em OK.'

// Sair do ajuste: o O sai sempre; o X só depois de ter sido solto desde que entrou (o mesmo aperto
// que entra no ajuste não pode sair dele). armed = o X já foi solto
export function adjustExit(armed: boolean, pad: { xDown: boolean; xFired: boolean; oFired: boolean }) {
  const ready = armed || !pad.xDown
  return { armed: ready, exit: pad.oFired || (ready && pad.xFired) }
}
