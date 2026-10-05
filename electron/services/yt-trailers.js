// Trailer dublado ou legendado pelo YouTube (chave grátis da YouTube Data API v3).
// Cada busca custa 1/100 da cota grátis do dia: guarda o resultado por título por 30 dias
// e para em 90 buscas por dia. Sem chave, o Início usa só os trailers do TMDB.
const { searchQuery, rankYoutube } = require('../core/yt-trailers')
const { cleanKey, wrongKeyMsg } = require('../core/keys')

const SECRET = 'youtube'
const LIMIT = 90
const DAY = 24 * 3600 * 1000
const KEEP_MS = 30 * DAY

function createYtTrailers({ yt, secrets, readCache, writeCache, readUsage, writeUsage, now = Date.now }) {
  const today = () => Math.floor(now() / DAY)
  async function usedToday() {
    const u = await readUsage()
    return u && u.day === today() ? u.count : 0
  }

  async function find(item) {
    const key = secrets.get(SECRET)
    const q = item && item.id ? searchQuery(item) : ''
    if (!key || !q) return []
    const cache = { ...((await readCache()) || {}) }
    const hit = cache[item.id]
    if (hit && now() - hit.at < KEEP_MS) return hit.list
    const used = await usedToday()
    if (used >= LIMIT) return []
    let results
    try {
      results = await yt.search(key, q)
    } catch (e) {
      if (e.code === 'quota') await writeUsage({ day: today(), count: LIMIT })
      return []
    }
    await writeUsage({ day: today(), count: used + 1 })
    const list = rankYoutube(results, item)
    cache[item.id] = { at: now(), list }
    await writeCache(cache)
    return list
  }

  async function status() {
    return { configured: !!secrets.get(SECRET), left: LIMIT - (await usedToday()) }
  }

  async function setKey(raw) {
    const key = cleanKey(raw)
    if (!key) return { ok: false, msg: 'Cole a chave da YouTube Data API.' }
    if (wrongKeyMsg(key, 'youtube')) return { ok: false, msg: wrongKeyMsg(key, 'youtube') }
    if (!(await yt.ping(key))) return { ok: false, msg: 'O YouTube recusou essa chave. Confira se a "YouTube Data API v3" está ativada no projeto da chave.' }
    if (!secrets.set(SECRET, key)) return { ok: false, msg: 'Não consegui guardar a chave com segurança neste PC.' }
    return { ok: true, msg: 'Chave do YouTube salva. O Início vai procurar trailers dublados e legendados.' }
  }

  async function clearKey() {
    secrets.clear(SECRET)
    return { ok: true, msg: 'Chave do YouTube removida.' }
  }

  return { find, status, setKey, clearKey }
}

module.exports = { createYtTrailers, LIMIT }
