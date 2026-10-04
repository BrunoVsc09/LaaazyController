import type { Game } from './lazy-api'

export type LibraryView = { platform: string; query: string }

export function visibleGames(games: Game[], { platform, query }: LibraryView): Game[] {
  const q = query.toLowerCase()
  return games.filter((g) => (platform === 'Todos' || g.platform === platform) && g.name.toLowerCase().includes(q))
}
