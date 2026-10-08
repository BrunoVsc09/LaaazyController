// Teclado na tela: layout, o que cada tecla faz e os botões do controle. Sem DOM.
import gamepad from '../../shared/gamepad'
import { HINT_ICONS, type Hint } from './footer-hints'

const { BTN } = gamepad

// Grade de 11 colunas, como o teclado do Hydra: o Enter ocupa duas linhas e o Espaço é largo (CSS)
export const OSK_ROWS: string[][] = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'backspace'],
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', 'clear'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ç', 'enter'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm', '-', '_', '.'],
  ['shift', 'space', 'left', 'right'],
]

export const KEY_LABEL: Record<string, string> = {
  shift: 'Shift', space: 'Espaço', backspace: '⌫', clear: 'Limpar', enter: 'Enter', left: '←', right: '→',
}

// Botão do controle que faz o mesmo que a tecla (aparece no canto dela)
export const KEY_PAD: Record<string, string> = { backspace: '□', space: '△', enter: 'R2', left: 'L1', right: 'R1' }

const MAX = 200

export type OskState = { value: string; caret: number; shift: boolean }
// O que a tecla fez, para repetir no campo de outro programa (teclado por cima; ver core/typing)
export type OskEdit = { move?: number; back?: number; text?: string; enter?: boolean }
export type OskResult = OskState & { done: boolean; edit: OskEdit | null }

function insert(s: OskState, ch: string): OskResult {
  if (s.value.length >= MAX) return { ...s, done: false, edit: null }
  const value = s.value.slice(0, s.caret) + ch + s.value.slice(s.caret)
  return { value, caret: s.caret + 1, shift: false, done: false, edit: { text: ch } }
}

const same = (s: OskState, edit: OskEdit | null = null, done = false): OskResult => ({ ...s, done, edit })

export function applyKey(s: OskState, key: string): OskResult {
  const { value, caret } = s
  switch (key) {
    case 'shift': return same({ ...s, shift: !s.shift })
    case 'space': return { ...insert(s, ' '), shift: s.shift }
    case 'backspace':
      if (!caret) return same(s)
      return same({ ...s, value: value.slice(0, caret - 1) + value.slice(caret), caret: caret - 1 }, { back: 1 })
    case 'left': return caret > 0 ? same({ ...s, caret: caret - 1 }, { move: -1 }) : same(s)
    case 'right': return caret < value.length ? same({ ...s, caret: caret + 1 }, { move: 1 }) : same(s)
    case 'clear': {
      if (!value) return same(s)
      const toEnd = value.length - caret
      return same({ ...s, value: '', caret: 0 }, toEnd ? { move: toEnd, back: value.length } : { back: value.length })
    }
    case 'enter': return same(s, { enter: true }, true)
    default: return insert(s, s.shift ? key.toUpperCase() : key)
  }
}

export const maskValue = (value: string, secret: boolean) => (secret ? '•'.repeat(value.length) : value)

// Texto antes e depois do cursor (a tela desenha a barrinha no meio)
export const splitAtCaret = (value: string, caret: number, secret: boolean): [string, string] =>
  [maskValue(value.slice(0, caret), secret), maskValue(value.slice(caret), secret)]

// Segurar o botão repete a tecla: primeiro um instante parado (um toque não vale por dois)
const HOLD_MS = 400
const EVERY_MS = 60
const TAP: [number, string][] = [[BTN.TRIANGLE, 'space'], [BTN.R2, 'enter']]
const REPEAT: [number, string][] = [[BTN.SQUARE, 'backspace'], [BTN.L1, 'left'], [BTN.R1, 'right']]

export type OskPadFrame = { fired: (button: number) => boolean; down: (button: number) => boolean }

// Teclas apertadas pelo controle neste quadro (X e O ficam com a tela)
export function createOskPad() {
  const since = new Map<number, number>() // botão → quando repetiu pela última vez (ou apertou)
  return function keys({ fired, down }: OskPadFrame, now: number): string[] {
    const out = TAP.filter(([b]) => fired(b)).map(([, k]) => k)
    for (const [b, k] of REPEAT) {
      if (fired(b)) { since.set(b, now + HOLD_MS - EVERY_MS); out.push(k); continue }
      const last = since.get(b)
      if (!down(b) || last === undefined) { since.delete(b); continue }
      if (now - last >= EVERY_MS) { since.set(b, now); out.push(k) }
    }
    return out
  }
}

export const OSK_HINTS: Hint[] = [
  { ...HINT_ICONS.cross, label: 'Digitar' },
  { ...HINT_ICONS.square, label: 'Apagar' },
  { ...HINT_ICONS.triangle, label: 'Espaço' },
  { ...HINT_ICONS.circle, label: 'Fechar' },
]
