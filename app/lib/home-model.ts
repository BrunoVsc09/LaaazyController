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

export type TitleRow = { id: string; title: string; items: Title[] }

export function buildRows({ series, films, myList = [] }: { series: Title[]; films: Title[]; myList?: Title[] }): TitleRow[] {
  const rows: TitleRow[] = [
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
