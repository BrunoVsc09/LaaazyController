// Filmes e séries em alta nos serviços do usuário (fonte: TMDB), com cache de 6 horas.
const { resolveProviders, mergeLists, pickTrailer, parseItemId } = require('../core/catalog')

const CACHE_MS = 6 * 3600 * 1000
const SECRET = 'tmdb'
const KINDS = ['tv', 'movie']

function createCatalog({ tmdb, secrets, readCache, writeCache, now = Date.now }) {
  const trailers = new Map()
  const token = () => secrets.get(SECRET)

  const status = () => ({ configured: !!token() })

  async function setKey(raw) {
    const key = typeof raw === 'string' ? raw.trim() : ''
    if (!key) return { ok: false, msg: 'Cole a chave do TMDB (API Read Access Token).' }
    if (!(await tmdb.ping(key))) return { ok: false, msg: 'O TMDB recusou essa chave. Confira se copiou o "API Read Access Token".' }
    if (!secrets.set(SECRET, key)) return { ok: false, msg: 'Não consegui guardar a chave com segurança neste PC.' }
    await writeCache(null)
    trailers.clear()
    return { ok: true, msg: 'Chave salva. Filmes e séries vão aparecer no Início.' }
  }

  async function clearKey() {
    secrets.clear(SECRET)
    await writeCache(null)
    trailers.clear()
    return { ok: true, msg: 'Chave do TMDB removida.' }
  }

  // Um discover por serviço e por tipo; o TMDB já ordena por popularidade no Brasil
  async function fetchKind(key, kind) {
    const ids = resolveProviders(await tmdb.providers(key, kind))
    const lists = await Promise.all(Object.entries(ids).map(async ([service, pid]) =>
      ({ service, results: await tmdb.discover(key, kind, pid) })))
    return mergeLists(lists, kind)
  }

  async function home({ fresh = false } = {}) {
    const key = token()
    if (!key) return { ok: false, configured: false, series: [], films: [], msg: 'Configure a chave do TMDB em Configurações para ver filmes e séries.' }
    const cache = await readCache()
    if (!fresh && cache && now() - cache.at < CACHE_MS) return { ok: true, configured: true, series: cache.series, films: cache.films }
    try {
      const [series, films] = await Promise.all(KINDS.map((k) => fetchKind(key, k)))
      await writeCache({ at: now(), series, films })
      return { ok: true, configured: true, series, films }
    } catch (e) {
      if (cache) return { ok: true, configured: true, stale: true, series: cache.series, films: cache.films, msg: 'Sem conexão com o TMDB; mostrando a última lista.' }
      return { ok: false, configured: true, series: [], films: [], msg: 'Não consegui falar com o TMDB: ' + e.message }
    }
  }

  // Chave do vídeo no YouTube, ou null
  async function trailer(itemId) {
    const ref = parseItemId(itemId)
    const key = token()
    if (!ref || !key) return null
    if (trailers.has(itemId)) return trailers.get(itemId)
    try {
      const yt = pickTrailer(await tmdb.videos(key, ref.kind, ref.id))
      trailers.set(itemId, yt)
      return yt
    } catch { return null }
  }

  return { status, setKey, clearKey, home, trailer }
}

module.exports = { createCatalog }
