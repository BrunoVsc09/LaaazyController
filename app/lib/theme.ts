// Cor do Laaazy: qual tema vale, o nome dele e o próximo (✕ na linha das Configurações). Sem DOM.
import THEMES from '../../shared/themes'

type Theme = { id: string; label: string; effect: boolean }
const LIST = THEMES as Theme[]

export const DEFAULT_THEME = 'azul'
export const themeOf = (v: unknown): string => (LIST.some((t) => t.id === v) ? (v as string) : DEFAULT_THEME)
export const themeLabel = (id: string) => LIST.find((t) => t.id === themeOf(id))!.label
export const hasEffect = (id: string) => LIST.find((t) => t.id === themeOf(id))!.effect
export function nextTheme(id: string): string {
  const i = LIST.findIndex((t) => t.id === themeOf(id))
  return LIST[(i + 1) % LIST.length].id
}

// Aplica o tema na página inteira (o CSS de app/themes.css lê o data-theme do <html>)
export const applyTheme = (id: unknown) => { document.documentElement.dataset.theme = themeOf(id) }
