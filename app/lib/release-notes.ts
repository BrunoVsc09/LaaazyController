// Novidades da versão (depois de atualizar): textos da janelinha, fim da rolagem e avatares do rodapé.
export const notesHeading = (version: string) => `Novidades da versão ${version}`

export function notesDate(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  return m ? `${m[3]}/${m[2]}/${m[1]}` : ''
}

const ICONS: Record<string, string> = { Destaques: '⭐', Novo: '✨', Mudou: '🔧', Corrigido: '🩹' }
export const sectionIcon = (title: string) => ICONS[title] ?? '•'

// Só fecha depois de chegar ao fim (com folga: a rolagem às vezes para a uns pixels do fundo).
// Se tudo coube sem rolar, já está no fim
const SLACK = 4
export const reachedEnd = ({ scrollTop, clientHeight, scrollHeight }: { scrollTop: number; clientHeight: number; scrollHeight: number }) =>
  scrollTop + clientHeight >= scrollHeight - SLACK

// Rodapé: todos os avatares que vêm com o Laaazy, menos o logo (a foto padrão, não é avatar novo)
const LOGO = 'avatar-01'
export const footerAvatars = <T extends { id: string }>(avatars: T[]) => avatars.filter((a) => a.id !== LOGO)
