// Capas do SteamGridDB para jogos da Epic e do PC. Sem chave, a biblioteca fica como está.
const { applyCovers, toLookup, pickGrid } = require('../core/covers')
const { cleanKey } = require('../core/keys')

const SECRET = 'steamgriddb'

function createCovers({ sgdb, secrets, readCache, writeCache, now = Date.now }) {
  const token = () => secrets.get(SECRET)

  async function find(key, game) {
    const [hit] = await sgdb.searchGame(key, game.name)
    return hit ? pickGrid(await sgdb.grids(key, hit.id)) : null
  }

  async function fill(games) {
    const key = token()
    if (!key) return games
    const cache = { ...(await readCache()) }
    const todo = toLookup(games, cache, now())
    if (todo.length) {
      for (const g of todo) {
        try { cache[g.id] = { url: await find(key, g), at: now() } } catch { /* sem internet: tenta na próxima */ }
      }
      await writeCache(cache)
    }
    return applyCovers(games, cache)
  }

  async function setKey(raw) {
    const key = cleanKey(raw)
    if (!key) return { ok: false, msg: 'Cole a chave do SteamGridDB.' }
    if (!(await sgdb.ping(key))) return { ok: false, msg: 'O SteamGridDB recusou essa chave.' }
    if (!secrets.set(SECRET, key)) return { ok: false, msg: 'Não consegui guardar a chave com segurança neste PC.' }
    // Esquece os "não achou" antigos: com a chave nova, vale tentar de novo
    const cache = await readCache()
    await writeCache(Object.fromEntries(Object.entries(cache).filter(([, c]) => c.url)))
    return { ok: true, msg: 'Chave salva. As capas aparecem na Biblioteca.' }
  }

  async function clearKey() {
    secrets.clear(SECRET)
    return { ok: true, msg: 'Chave do SteamGridDB removida.' }
  }

  return { fill, setKey, clearKey, status: () => ({ configured: !!token() }) }
}

module.exports = { createCovers }
