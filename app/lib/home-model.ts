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

export function buildRows({ series, films, myList = [], news = [] }: { series: Title[]; films: Title[]; myList?: Title[]; news?: EpisodeNews[] }): TitleRow[] {
  const withNews = news.map((n) => myList.find((t) => t.id === n.id)).filter((t): t is Title => !!t)
  const rows: TitleRow[] = [
    { id: 'news', title: 'Novos episódios', items: withNews, badges: Object.fromEntries(news.map((n) => [n.id, n.label])) },
    { id: 'mylist', title: 'Minha lista', items: myList },
    { id: 'series', title: 'Séries em alta nos seus apps', items: series },
    { id: 'films', title: 'Filmes em alta nos seus apps', items: films },
  ]
  return rows.filter((r) => r.items.length > 0)
}

const KNOWN = new Set(streaming.map((s) => s.label))

export function heroInfo(t: Title) {
  const meta = [t.kind, t.year, t.services.join(', ')].filter(Boolean).join(' · ')
  return { meta, primary: t.services.find((s) => KNOWN.has(s)) ?? null }
}
