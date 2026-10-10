// Editor de perfis do controle (Laaazy-pad): regras da tela, sem DOM.
import type { PadAction, PadProfile } from './lazy-api'

// Gamepad API ("standard") → nome do botão no perfil do Laaazy-pad
const PAD_BUTTONS = ['Cruz', 'Circulo', 'Quadrado', 'Triangulo', 'L1', 'R1', 'L2', 'R2', 'Share', 'Options',
  'L3', 'R3', 'DpadCima', 'DpadBaixo', 'DpadEsquerda', 'DpadDireita', 'PS', 'Touchpad']
export const padButtonAt = (index: number): string | null => PAD_BUTTONS[index] ?? null

// Tecla do navegador (KeyboardEvent.code) → nome que o Laaazy-pad aceita
const CODE_NAMES: Record<string, string> = {
  Escape: 'Esc', Enter: 'Enter', NumpadEnter: 'Enter', Tab: 'Tab', Space: 'Space', Backspace: 'Backspace',
  Delete: 'Delete', Insert: 'Insert', Home: 'Home', End: 'End', PageUp: 'PageUp', PageDown: 'PageDown',
  ArrowUp: 'Up', ArrowDown: 'Down', ArrowLeft: 'Left', ArrowRight: 'Right', PrintScreen: 'PrintScreen',
  AudioVolumeUp: 'VolumeUp', AudioVolumeDown: 'VolumeDown', AudioVolumeMute: 'VolumeMute',
  MediaPlayPause: 'MediaPlayPause', MediaTrackNext: 'MediaNext', MediaTrackPrevious: 'MediaPrevious',
}
function keyName(code: string): string | null {
  if (/^Key[A-Z]$/.test(code)) return code.slice(3)
  if (/^Digit[0-9]$/.test(code)) return code.slice(5)
  if (/^Numpad[0-9]$/.test(code)) return 'Num' + code.slice(6)
  if (/^F([1-9]|1[0-2])$/.test(code)) return code
  return CODE_NAMES[code] ?? null
}

type KeyLike = { key: string; code: string; ctrlKey: boolean; altKey: boolean; shiftKey: boolean; metaKey: boolean }

// "Gravar atalho": a combinação apertada no teclado, como o Laaazy-pad escreve (Ctrl+Alt+K).
// Só modificador apertado ou tecla desconhecida → null (continua gravando)
export function shortcutFromKey(e: KeyLike): string | null {
  const key = keyName(e.code)
  if (!key) return null
  const mods = [e.ctrlKey && 'Ctrl', e.altKey && 'Alt', e.shiftKey && 'Shift', e.metaKey && 'Win'].filter(Boolean)
  return [...mods, key].join('+')
}

// Atalhos do Laaazy com nome amigável (são os comandos fixos dos perfis)
const LAAAZY_KEYS: Record<string, string> = {
  'ctrl+alt+home': 'Voltar ao Início', 'ctrl+alt+k': 'Teclado por cima',
  'ctrl+alt+down': 'Volume −', 'ctrl+alt+up': 'Volume +',
}
export const CLICK_OPTIONS = [
  { value: 'esquerdo', label: 'Esquerdo' }, { value: 'direito', label: 'Direito' }, { value: 'meio', label: 'Meio' },
  { value: 'voltar', label: 'Voltar' }, { value: 'avancar', label: 'Avançar' },
]
const CLICK_TEXT: Record<string, string> = {
  esquerdo: 'Clique esquerdo', direito: 'Clique direito', meio: 'Clique do meio', voltar: 'Mouse: voltar', avancar: 'Mouse: avançar',
}

export function actionLabel(action: PadAction): string {
  if (!action) return 'Nada'
  if ('clique' in action) return CLICK_TEXT[action.clique] ?? action.clique
  return LAAAZY_KEYS[action.tecla.toLowerCase()] ?? `Tecla ${action.tecla}`
}

// Para quem só tem o controle na mão (sem teclado para gravar)
export const COMMON_KEYS = ['Enter', 'Esc', 'Space', 'Tab', 'F11', 'Alt+Tab']

// L1/R1: perfil anterior/seguinte, dando a volta
export function nextProfile(profiles: string[], current: string, step: 1 | -1): string {
  if (!profiles.length) return current
  const i = profiles.indexOf(current)
  return profiles[(i + step + profiles.length) % profiles.length]
}

// Botão de voltar ao Laaazy gravado no controle (para controle sem PS que funcione, ex.: 8BitDo):
// faz o mesmo que o PS nos dois perfis. Só botões que o Laaazy não usa para navegar
export const BACK_KEY = 'Ctrl+Alt+Home'
const BACK_CHOICES = ['L3', 'R3', 'Options']
const isBack = (a: PadAction) => !!a && 'tecla' in a && a.tecla.toLowerCase() === BACK_KEY.toLowerCase()

export function backChoiceError(id: string): string {
  if (BACK_CHOICES.includes(id)) return ''
  if (id === 'PS') return 'Esse é o PS: ele já volta ao Laaazy. Escolha L3, R3 ou Start.'
  return 'Use L3 ou R3 (apertar um dos analógicos) ou Start: os outros botões o Laaazy usa para navegar.'
}

// O que mudar em cada perfil: o escolhido passa a voltar; o gravado antes (outro da lista) sai
export function backChanges(profiles: PadProfile[], chosen: string) {
  const changes: { profile: string; id: string; action: PadAction }[] = []
  for (const p of profiles) {
    for (const b of p.buttons) {
      if (b.id === chosen && !isBack(b.action)) changes.push({ profile: p.name, id: b.id, action: { tecla: BACK_KEY } })
      else if (b.id !== chosen && BACK_CHOICES.includes(b.id) && isBack(b.action)) changes.push({ profile: p.name, id: b.id, action: null })
    }
  }
  return changes
}

export const backButtonOf = (profiles: PadProfile[]) =>
  BACK_CHOICES.find((id) => profiles.some((p) => p.buttons.some((b) => b.id === id && isBack(b.action)))) ?? null
