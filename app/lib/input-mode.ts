// Controle e mouse sem brigar: o foco só segue o mouse quando ele se move de verdade.
// Quando o D-pad rola a tela, o cursor parado (mesmo invisível) passa a ficar em cima de
// outro card e o navegador avisa como se o mouse tivesse passado ali: isso não pode roubar o foco.
const MIN_MOVE = 4 // px
// Analógico que mexe o mouse e também aparece como controle: logo depois de um movimento
// real do mouse, sinal do controle não troca o modo (senão o cursor fica piscando)
const MOUSE_HOLD_MS = 250

export type InputMode = 'pad' | 'mouse'

export function createInputMode(now: () => number = () => performance.now()) {
  let mode: InputMode = 'pad'
  let last: { x: number; y: number } | null = null
  let movedAt = -Infinity
  return {
    mode: () => mode,
    // true = o mouse andou de verdade (passa para o modo mouse)
    mouseMoved(x: number, y: number) {
      if (!last) { last = { x, y }; return false }
      if (Math.abs(x - last.x) < MIN_MOVE && Math.abs(y - last.y) < MIN_MOVE) return false
      last = { x, y }
      mode = 'mouse'
      movedAt = now()
      return true
    },
    padUsed() { if (now() - movedAt >= MOUSE_HOLD_MS) mode = 'pad' },
  }
}
