// Busca local (apps e jogos). Filmes e séries vêm do TMDB pelo Electron.
import type { Card } from './catalog'
import type { Game } from './lazy-api'
import { appsGrid } from './home-model'

export const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

export function searchLocal(query: string, { cards, games }: { cards: Card[]; games: Game[] }) {
  const q = normalize(query)
  if (q.length < 2) return { apps: [] as Card[], games: [] as Game[] }
  return {
    apps: appsGrid(cards).filter((c) => normalize(c.label).includes(q)),
    games: games.filter((g) => normalize(g.name).includes(q)),
  }
}
