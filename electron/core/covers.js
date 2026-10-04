// Capas para jogos sem capa (Epic e PC). Sem I/O.
// Cache: { [gameId]: { url: string | null, at: ms } }; url null = "não achou".
const RETRY_MS = 7 * 24 * 3600 * 1000 // "não achou" vale por 7 dias
const MAX_LOOKUPS = 10                 // por vez, para não martelar a API

const applyCovers = (games, cache) =>
  games.map((g) => (g.cover || !cache[g.id] || !cache[g.id].url ? g : { ...g, cover: cache[g.id].url }))

function toLookup(games, cache, now) {
  return games
    .filter((g) => !g.cover)
    .filter((g) => { const c = cache[g.id]; return !c || (!c.url && now - c.at > RETRY_MS) })
    .slice(0, MAX_LOOKUPS)
}

const pickGrid = (grids) => (grids && grids[0] && grids[0].url) || null

module.exports = { applyCovers, toLookup, pickGrid }
