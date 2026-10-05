// Dicas do rodapé: só os comandos que funcionam em cada tela.
import gamepad from '../../shared/gamepad'
import type { Screen } from './screen-state'

const BLOB = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com'
const { BTN } = gamepad

export type Hint = { label: string; button: number; icon: string; cls: string }

// Ícone de cada botão do controle (o texto muda conforme a tela). As imagens de □ e △
// já estiveram trocadas: a de nome GXcI... é o triângulo.
export const HINT_ICONS: Record<'cross' | 'circle' | 'square' | 'triangle', Hint> = {
  cross: { label: '', button: BTN.X, icon: `${BLOB}/image-RmsaVZFRGft3ZQ23np6JD9Ct1RZztJ.png`, cls: 'confirm-command-icon' },
  circle: { label: '', button: BTN.O, icon: `${BLOB}/image-efPFMsWuBwJacjHRT3XAlB7m1bJ8gX.png`, cls: 'back-command-icon' },
  square: { label: '', button: BTN.SQUARE, icon: `${BLOB}/image-fbLU9pFFvFFk5kDdTWVlmaNWxKsSDw.png`, cls: 'search-command-icon' },
  triangle: { label: '', button: BTN.TRIANGLE, icon: `${BLOB}/image-GXcI3yAQ20XUtdiI4nztFeFYyfwOai.png`, cls: 'details-command-icon' },
}

const CONFIRM: Hint = { ...HINT_ICONS.cross, label: 'Confirmar' }
const BACK: Hint = { ...HINT_ICONS.circle, label: 'Voltar' }
const SEARCH: Hint = { ...HINT_ICONS.square, label: 'Buscar' }
const PROFILE: Hint = { ...HINT_ICONS.triangle, label: 'Perfil do controle' }
const SIMILAR: Hint = { ...HINT_ICONS.triangle, label: 'Parecidos' }
const PREVIEW: Hint = { ...HINT_ICONS.cross, label: 'Prévia · 2x assistir' }

const BY_SCREEN: Record<Screen, Hint[]> = {
  home: [PREVIEW, SEARCH, SIMILAR],
  library: [CONFIRM, BACK, SEARCH, PROFILE],
  apps: [CONFIRM, BACK, SEARCH],
  search: [CONFIRM, BACK],
  ds4: [CONFIRM, BACK],
  settings: [CONFIRM, BACK],
}

export const hintsFor = (screen: Screen): Hint[] => BY_SCREEN[screen]
