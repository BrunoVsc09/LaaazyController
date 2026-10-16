// Novidades da versão (depois de atualizar): textos da janelinha, espera do Continuar e avatares do rodapé.
export const notesHeading = (version: string) => `Novidades da versão ${version}`

export function notesDate(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  return m ? `${m[3]}/${m[2]}/${m[1]}` : ''
}

const ICONS: Record<string, string> = { Destaques: '⭐', Novo: '✨', Mudou: '🔧', Corrigido: '🩹' }
export const sectionIcon = (title: string) => ICONS[title] ?? '•'

// "Continuar" só depois de alguns segundos (dá tempo de ver as novidades); o botão mostra quanto falta
export const NOTES_WAIT_S = 6
export const continueLabel = (secondsLeft: number) => (secondsLeft > 0 ? `Continuar (${secondsLeft})` : 'Continuar')

// Rodapé: todos os avatares que vêm com o Laaazy, menos o logo (a foto padrão, não é avatar novo)
const LOGO = 'avatar-01'
export const footerAvatars = <T extends { id: string }>(avatars: T[]) => avatars.filter((a) => a.id !== LOGO)
