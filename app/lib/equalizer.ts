// Equalizador (Configurações → Som): presets, ajustes pelo controle, textos e gráfico.
import eq from '../../shared/equalizer'
import type { EqState, EqStatus } from './lazy-api'

const { BANDS, BAND_LIMIT, EFFECT_MAX, PRESETS, CUSTOM } = eq
export { BANDS }

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

export function applyPreset(state: EqState, id: string): EqState {
  const p = PRESETS.find((x) => x.id === id) ?? PRESETS[0]
  return { on: state.on, preset: p.id, bands: [...p.bands], bass: p.bass, clarity: p.clarity }
}

export const FLAT: EqState = applyPreset({ on: true, preset: '', bands: [], bass: 0, clarity: 0 }, PRESETS[0].id)

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

// ←/→ no Bass Boost ou no Clarity: 0 a EFFECT_MAX
export function stepEffect(state: EqState, key: 'bass' | 'clarity', dir: 1 | -1): EqState {
  const v = clamp(state[key] + dir, 0, EFFECT_MAX)
  return v === state[key] ? state : { ...state, [key]: v, preset: CUSTOM.id }
}

export const dbText = (db: number) => (db > 0 ? `+${db}` : String(db))

// Pontos da curva no gráfico: bandas espalhadas na largura, +limite em cima e -limite embaixo
export function curvePoints(bands: number[], width: number, height: number) {
  const step = width / bands.length
  return bands.map((db, i) => ({ x: step * (i + 0.5), y: ((BAND_LIMIT - db) / (2 * BAND_LIMIT)) * height }))
}

export function statusText(status: EqStatus): string {
  if (!status.installed) {
    return 'Equalizer APO não encontrado. Instale o Equalizer APO (grátis), marque a sua saída de som no Configurator e abra o Laaazy de novo. Os ajustes ficam guardados até lá.'
  }
  return status.error
}
