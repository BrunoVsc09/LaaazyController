// Chamadas HTTP ao SteamGridDB (API v2). A chave vai só no cabeçalho Authorization.
const BASE = 'https://www.steamgriddb.com/api/v2'

function createSgdb({ fetch = globalThis.fetch } = {}) {
  async function get(token, path) {
    const res = await fetch(BASE + path, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } })
    if (res.status === 401) throw new Error('O SteamGridDB recusou a chave.')
    if (!res.ok) throw new Error(`O SteamGridDB respondeu com erro ${res.status}.`)
    return (await res.json()).data || []
  }

  async function ping(token) {
    try { await get(token, '/search/autocomplete/portal'); return true } catch { return false }
  }

  const searchGame = (token, name) => get(token, `/search/autocomplete/${encodeURIComponent(name)}`)

  // Mesmo formato horizontal das capas da Steam (460x215)
  const grids = (token, gameId) => get(token, `/grids/game/${gameId}?dimensions=460x215,920x430`)

  return { ping, searchGame, grids }
}

module.exports = { createSgdb }
