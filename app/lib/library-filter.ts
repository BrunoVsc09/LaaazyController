import type { Game } from './lazy-api'

export type Sort = 'asc' | 'desc'
export type LibraryView = { platform: string; query: string; sort?: Sort }

export function visibleGames(games: Game[], { platform, query, sort = 'asc' }: LibraryView): Game[] {
  const q = query.toLowerCase()
  const dir = sort === 'desc' ? -1 : 1
  return games
    .filter((g) => (platform === 'Todos' || g.platform === platform) && g.name.toLowerCase().includes(q))
    .sort((a, b) => dir * a.name.localeCompare(b.name, 'pt'))
}

export const nextSort = (s: Sort): Sort => (s === 'asc' ? 'desc' : 'asc')
