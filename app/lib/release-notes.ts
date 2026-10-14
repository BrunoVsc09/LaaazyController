// Novidades da versão (depois de atualizar): textos da janelinha.
export const notesHeading = (version: string) => `Novidades da versão ${version}`

export function notesDate(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  return m ? `${m[3]}/${m[2]}/${m[1]}` : ''
}

const ICONS: Record<string, string> = { Novo: '✨', Mudou: '🔧', Corrigido: '🩹' }
export const sectionIcon = (title: string) => ICONS[title] ?? '•'
