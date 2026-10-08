// O que o Início mostra: apps fixados, fileiras de títulos e o destaque.
import streaming from '../../shared/streaming'
import type { Card } from './catalog'
import type { Title } from './lazy-api'

export const DEFAULT_PINNED: string[] = streaming.map((s) => s.label)

export const togglePin = (pinned: string[], label: string) =>
  pinned.includes(label) ? pinned.filter((p) => p !== label) : [...pinned, label]

export const pinnedCards = (cards: Card[], pinned: string[]) =>
  pinned.map((l) => cards.find((c) => c.label === l)).filter((c): c is Card => !!c)

// A Biblioteca virou aba; o resto dos cards aparece na tela de Apps
export const appsGrid = (cards: Card[]) => cards.filter((c) => c.screen !== 'library')

export type TitleRow = { id: string; title: string; items: Title[]; badges?: Record<string, string> }
export type EpisodeNews = { id: string; label: string }

type RowsInput = { series: Title[]; films: Title[]; animes?: Title[]; myList?: Title[]; news?: EpisodeNews[] }

export function buildRows({ series, films, animes = [], myList = [], news = [] }: RowsInput): TitleRow[] {
  const withNews = news.map((n) => myList.find((t) => t.id === n.id)).filter((t): t is Title => !!t)
  const rows: TitleRow[] = [
    { id: 'news', title: 'Novos episódios', items: withNews, badges: Object.fromEntries(news.map((n) => [n.id, n.label])) },
    { id: 'mylist', title: 'Minha lista', items: myList },
    { id: 'films', title: 'Filmes nos seus apps', items: films },
    { id: 'series', title: 'Séries nos seus apps', items: series },
    { id: 'animes', title: 'Animes nos seus apps', items: animes },
  ]
  return rows.filter((r) => r.items.length > 0)
}

const KNOWN = new Set(streaming.map((s) => s.label))

export function heroInfo(t: Title) {
  const meta = [t.kind, t.year, t.services.join(', ')].filter(Boolean).join(' · ')
  return { meta, primary: t.services.find((s) => KNOWN.has(s)) ?? null }
}

// Cópia embaralhada (Fisher-Yates), cortada em `limit`: cada abertura do Início mostra outros títulos
export function shuffled<T>(items: T[], rand: () => number = Math.random, limit = items.length): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out.slice(0, limit)
}

// Parecidos (△): o título do card em foco, em qualquer fileira; fora de um título, nenhum
export const similarSource = (id: string | undefined, lists: Title[][]): Title | null =>
  (id && lists.flat().find((t) => t.id === id)) || null

// Avisos no destaque (sempre à vista, mesmo com a fileira dos parecidos lá em cima)
export const SIMILAR_MSG = {
  pick: 'Para ver parecidos, pare num filme ou série e aperte △.',
  searching: (title: string) => `Procurando títulos parecidos com "${title}"... a IA leva alguns segundos.`,
}
