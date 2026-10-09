// Controle e mouse sem brigar: o foco só segue o mouse quando ele se move de verdade.
// Quando o D-pad rola a tela, o cursor parado (mesmo invisível) passa a ficar em cima de
// outro card e o navegador avisa como se o mouse tivesse passado ali: isso não pode roubar o foco.
const MIN_MOVE = 4 // px
// Analógico que mexe o mouse e também aparece como controle: logo depois de um movimento
// real do mouse, sinal do controle não troca o modo (senão o cursor fica piscando)
const MOUSE_HOLD_MS = 250
// Analógico só navega com o mouse parado há 1 s e depois de 150 ms inclinado: no perfil PC
// ele move o cursor, e o 1º quadro chega antes do movimento do mouse
const STICK_QUIET_MS = 1000
const STICK_HOLD_MS = 150

export type InputMode = 'pad' | 'mouse'

export function createInputMode(now: () => number = () => performance.now()) {
  let mode: InputMode = 'pad'
  let last: { x: number; y: number } | null = null
  let movedAt = -Infinity
  let stickSince: number | null = null
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
    // Perfil PC do Laaazy-pad: o X também vira clique do mouse. Para não clicar duas vezes,
    // no modo controle só o X do controle clica; no modo mouse só o mouse.
    padClicks: () => mode === 'pad',
    mouseButtonsWork: () => mode === 'mouse',
    // Chamado a cada quadro com "o analógico está inclinado?"; true = pode navegar
    stickAllowed(tilted: boolean) {
      if (!tilted) { stickSince = null; return false }
      const t = now()
      if (stickSince === null) stickSince = t
      return t - stickSince >= STICK_HOLD_MS && t - movedAt >= STICK_QUIET_MS
    },
  }
}

// Um só por tela: o controle (useGamepad) e o mouse (useMouseFocus) consultam o mesmo modo
export const inputMode = createInputMode()
