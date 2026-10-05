// Filmes e séries em alta nos serviços do usuário (fonte: TMDB), com cache de 6 horas.
const { resolveProviders, mergeLists, searchItems, servicesFrom, rankTrailers, parseItemId, toItem } = require('../core/catalog')

const { episodeNews } = require('../core/episodes')
const { cleanKey, wrongKeyMsg } = require('../core/keys')
const explorer = require('../core/explore')

const CACHE_MS = 6 * 3600 * 1000
const CACHE_VERSION = 3
const MAX_SERIES = 20
const SECRET = 'tmdb'
const KINDS = ['tv', 'movie']
const PAGES = [1, 2, 3] // 3 páginas de 20 por serviço: o Início sorteia de uma lista grande
const POOL = 100 // títulos guardados por tipo

function createCatalog({ tmdb, secrets, readCache, writeCache, now = Date.now }) {
  const trailers = new Map()
  const places = new Map()
  const details = new Map() // série → { at, data }, por 6 horas
  const token = () => secrets.get(SECRET)

  const status = () => ({ configured: !!token() })

  async function setKey(raw) {
    const key = cleanKey(raw)
    if (!key) return { ok: false, msg: 'Cole a chave do TMDB (API Read Access Token).' }
    if (wrongKeyMsg(key, 'tmdb')) return { ok: false, msg: wrongKeyMsg(key, 'tmdb') }
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
      ({ service, results: (await Promise.all(PAGES.map((p) => tmdb.discover(key, kind, pid, p)))).flat() })))
    return mergeLists(lists, kind, POOL)
  }

  async function home({ fresh = false } = {}) {
    const key = token()
    if (!key) return { ok: false, configured: false, series: [], films: [], animes: [], msg: 'Configure a chave do TMDB em Configurações para ver filmes e séries.' }
    const cache = await readCache()
    // v: 3 = 3 páginas por serviço e animes separados; cache de versão antiga é buscado de novo
    if (!fresh && cache && cache.v === CACHE_VERSION && now() - cache.at < CACHE_MS) return { ok: true, configured: true, series: cache.series, films: cache.films, animes: cache.animes || [] }
    try {
      const [tv, movies] = await Promise.all(KINDS.map((k) => fetchKind(key, k)))
      const series = tv.filter((x) => !x.anime)
      const films = movies.filter((x) => !x.anime)
      const animes = [...tv, ...movies].filter((x) => x.anime).sort((a, b) => b.popularity - a.popularity)
      await writeCache({ v: CACHE_VERSION, at: now(), series, films, animes })
      return { ok: true, configured: true, series, films, animes }
    } catch (e) {
      if (cache) return { ok: true, configured: true, stale: true, series: cache.series, films: cache.films, animes: cache.animes || [], msg: 'Sem conexão com o TMDB; mostrando a última lista.' }
      return { ok: false, configured: true, series: [], films: [], msg: 'Não consegui falar com o TMDB: ' + e.message }
    }
  }

  // [{ key, lang }] dos trailers no YouTube, do melhor ao pior (português primeiro); [] sem nenhum.
  // Série sem vídeo no cadastro geral: procura na 1ª temporada.
  async function trailer(itemId) {
    const ref = parseItemId(itemId)
    const key = token()
    if (!ref || !key) return []
    if (trailers.has(itemId)) return trailers.get(itemId)
    try {
      let list = rankTrailers(await tmdb.videos(key, ref.kind, ref.id))
      if (!list.length && ref.kind === 'tv') list = rankTrailers(await tmdb.seasonVideos(key, ref.id, 1))
      trailers.set(itemId, list)
      return list
    } catch { return [] }
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

  // Explorar sem digitar: tipo, categoria, duração e ordem, só nos serviços do usuário
  async function explore(raw) {
    const key = token()
    if (!key) return { ok: false, configured: false, items: [], msg: 'Configure a chave do TMDB em Configurações para explorar.' }
    const sel = explorer.toSelection(raw)
    try {
      const found = []
      for (const kind of explorer.kindsFor(sel)) {
        const pids = Object.values(resolveProviders(await tmdb.providers(key, kind)))
        const params = explorer.exploreParams(sel, kind, pids, today())
        if (!params) continue
        for (const r of await tmdb.discoverWith(key, kind, params)) {
          const item = toItem(r, kind)
          if (item) found.push({ item, date: r.release_date || r.first_air_date || '', rating: r.vote_average || 0 })
        }
      }
      const by = { recent: (a, b) => b.date.localeCompare(a.date), rated: (a, b) => b.rating - a.rating, popular: (a, b) => b.item.popularity - a.item.popularity }
      return { ok: true, configured: true, items: found.sort(by[sel.sort]).slice(0, 40).map((f) => f.item) }
    } catch (e) {
      return { ok: false, configured: true, items: [], msg: 'Não consegui buscar no TMDB: ' + e.message }
    }
  }

  return { status, setKey, clearKey, home, trailer, search, where, episodes, explore }
}

module.exports = { createCatalog }
