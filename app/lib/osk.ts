// Teclado na tela: layout e o que cada tecla faz. Sem DOM.
import { HINT_ICONS, type Hint } from './footer-hints'

export const OSK_ROWS: string[][] = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ç'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm', '-', '_', '.'],
  ['shift', 'space', 'backspace', 'clear', 'done'],
]

export const KEY_LABEL: Record<string, string> = {
  shift: '⇧ Maiúscula', space: 'Espaço', backspace: '⌫ Apagar', clear: 'Limpar', done: '✓ Pronto',
}

const MAX = 200

export type OskState = { value: string; shift: boolean }

export function applyKey({ value, shift }: OskState, key: string): OskState & { done: boolean } {
  switch (key) {
    case 'shift': return { value, shift: !shift, done: false }
    case 'space': return { value: (value + ' ').slice(0, MAX), shift, done: false }
    case 'backspace': return { value: value.slice(0, -1), shift, done: false }
    case 'clear': return { value: '', shift, done: false }
    case 'done': return { value, shift, done: true }
    default: {
      const ch = shift ? key.toUpperCase() : key
      return { value: (value + ch).slice(0, MAX), shift: false, done: false }
    }
  }
}

export const maskValue = (value: string, secret: boolean) => (secret ? '•'.repeat(value.length) : value)

export const OSK_HINTS: Hint[] = [
  { ...HINT_ICONS.cross, label: 'Digitar' },
  { ...HINT_ICONS.square, label: 'Apagar' },
  { ...HINT_ICONS.triangle, label: 'Espaço' },
  { ...HINT_ICONS.circle, label: 'Fechar' },
]
