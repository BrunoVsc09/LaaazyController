// Filmes e séries em alta nos serviços do usuário (fonte: TMDB), com cache de 6 horas.
const { resolveProviders, mergeLists, searchItems, servicesFrom, pickTrailer, parseItemId } = require('../core/catalog')

const { episodeNews } = require('../core/episodes')
const { cleanKey } = require('../core/keys')

const CACHE_MS = 6 * 3600 * 1000
const MAX_SERIES = 20
const SECRET = 'tmdb'
const KINDS = ['tv', 'movie']

function createCatalog({ tmdb, secrets, readCache, writeCache, now = Date.now }) {
  const trailers = new Map()
  const places = new Map()
  const details = new Map() // série → { at, data }, por 6 horas
  const token = () => secrets.get(SECRET)

  const status = () => ({ configured: !!token() })

  async function setKey(raw) {
    const key = cleanKey(raw)
    if (!key) return { ok: false, msg: 'Cole a chave do TMDB (API Read Access Token).' }
    const check = await tmdb.ping(key)
    if (check.reason === 'offline') return { ok: false, msg: `Não consegui falar com o TMDB para testar a chave (${check.detail}). Confira a internet e tente de novo.` }
    if (!check.ok) return { ok: false, msg: 'O TMDB recusou essa chave. Cole a "Chave da API" (32 letras e números) ou o "Token de Leitura da API" (texto longo que começa com eyJ), sem espaços.' }
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

  async function search(raw) {
    const query = typeof raw === 'string' ? raw.trim() : ''
    const key = token()
    if (!key) return { ok: false, configured: false, items: [], msg: 'Configure a chave do TMDB para buscar filmes e séries.' }
    if (query.length < 2) return { ok: true, configured: true, items: [] }
    try {
      return { ok: true, configured: true, items: searchItems(await tmdb.search(key, query)).slice(0, 20) }
    } catch (e) {
      return { ok: false, configured: true, items: [], msg: 'Não consegui buscar no TMDB: ' + e.message }
    }
  }

  // Em quais serviços do app (no Brasil) o título está
  async function where(itemId) {
    const ref = parseItemId(itemId)
    const key = token()
    if (!ref || !key) return []
    if (places.has(itemId)) return places.get(itemId)
    try {
      const list = servicesFrom(await tmdb.watchProviders(key, ref.kind, ref.id))
      places.set(itemId, list)
      return list
    } catch { return [] }
  }

  // Data de hoje no fuso do PC, no formato AAAA-MM-DD
  const today = () => {
    const d = new Date(now())
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  // Séries da Minha lista com episódio novo ou chegando
  async function episodes(list) {
    const key = token()
    if (!key) return []
    const out = []
    for (const item of (list || []).filter((x) => parseItemId(x.id)?.kind === 'tv').slice(0, MAX_SERIES)) {
      const { id } = parseItemId(item.id)
      let cached = details.get(item.id)
      if (!cached || now() - cached.at > CACHE_MS) {
        try { cached = { at: now(), data: await tmdb.tvDetails(key, id) } } catch { continue }
        details.set(item.id, cached)
      }
      const news = episodeNews(cached.data, today())
      if (news) out.push({ id: item.id, ...news })
    }
    return out
  }

  return { status, setKey, clearKey, home, trailer, search, where, episodes }
}

module.exports = { createCatalog }
