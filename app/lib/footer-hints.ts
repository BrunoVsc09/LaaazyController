// Dicas do rodapé: só os comandos que funcionam em cada tela.
import gamepad from '../../shared/gamepad'
import type { Screen } from './screen-state'

const BLOB = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com'
const { BTN } = gamepad

export type Hint = { label: string; button: number; icon: string; cls: string }

const CONFIRM: Hint = { label: 'Confirmar', button: BTN.X, icon: `${BLOB}/image-RmsaVZFRGft3ZQ23np6JD9Ct1RZztJ.png`, cls: 'confirm-command-icon' }
const BACK: Hint = { label: 'Voltar', button: BTN.O, icon: `${BLOB}/image-efPFMsWuBwJacjHRT3XAlB7m1bJ8gX.png`, cls: 'back-command-icon' }
const SEARCH: Hint = { label: 'Buscar', button: BTN.SQUARE, icon: `${BLOB}/image-GXcI3yAQ20XUtdiI4nztFeFYyfwOai.png`, cls: 'search-command-icon' }

const BY_SCREEN: Record<Screen, Hint[]> = {
  home: [CONFIRM],
  library: [CONFIRM, BACK, SEARCH],
  ds4: [CONFIRM, BACK],
  settings: [CONFIRM, BACK],
}

export const hintsFor = (screen: Screen): Hint[] => BY_SCREEN[screen]
