// Chamadas HTTP à API do TMDB (v3). Aceita as duas credenciais da página do TMDB:
// - "Chave da API" (32 caracteres): vai como api_key na URL (é assim que o TMDB exige)
// - "Token de Leitura da API" (longo, eyJ...): vai só no cabeçalho Authorization
// Nunca em log.
const BASE = 'https://api.themoviedb.org/3'
const REGION = { watch_region: 'BR', language: 'pt-BR' }
const V3_KEY = /^[a-f0-9]{32}$/i

function createTmdb({ fetch = globalThis.fetch } = {}) {
  async function get(token, path, params = {}) {
    const url = new URL(BASE + path)
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v))
    const headers = { Accept: 'application/json' }
    if (V3_KEY.test(token)) url.searchParams.set('api_key', token)
    else headers.Authorization = `Bearer ${token}`
    const res = await fetch(url.toString(), { headers })
    if (res.status === 401) throw new Error('O TMDB recusou a chave.')
    if (!res.ok) throw new Error(`O TMDB respondeu com erro ${res.status}.`)
    return res.json()
  }

  // { ok } | { ok: false, reason: 'refused' } | { ok: false, reason: 'offline', detail }
  async function ping(token) {
    try {
      return (await get(token, '/authentication')).success ? { ok: true } : { ok: false, reason: 'refused' }
    } catch (e) {
      if (/recusou a chave/.test(e.message)) return { ok: false, reason: 'refused' }
      return { ok: false, reason: 'offline', detail: e.message }
    }
  }

  const providers = async (token, kind) => (await get(token, `/watch/providers/${kind}`, REGION)).results || []

  const discover = async (token, kind, providerId, page = 1) => (await get(token, `/discover/${kind}`, {
    ...REGION,
    with_watch_providers: providerId,
    with_watch_monetization_types: 'flatrate',
    sort_by: 'popularity.desc',
    page,
  })).results || []

  const videos = async (token, kind, id) =>
    (await get(token, `/${kind}/${id}/videos`, { language: 'pt-BR', include_video_language: 'pt,en,null' })).results || []

  // Séries costumam ter o trailer só na temporada
  const seasonVideos = async (token, id, season) =>
    (await get(token, `/tv/${id}/season/${season}/videos`, { language: 'pt-BR', include_video_language: 'pt,en,null' })).results || []

  const search = async (token, query) =>
    (await get(token, '/search/multi', { query, language: 'pt-BR', include_adult: false, page: 1 })).results || []

  // Só os de assinatura (flatrate) no Brasil
  const watchProviders = async (token, kind, id) => {
    const br = ((await get(token, `/${kind}/${id}/watch/providers`)).results || {}).BR
    return (br && br.flatrate) || []
  }

  const tvDetails = (token, id) => get(token, `/tv/${id}`, { language: 'pt-BR' })

  // Discover com filtros livres (já montados e validados por core/ai-filters)
  const discoverWith = async (token, kind, params) => (await get(token, `/discover/${kind}`, params)).results || []

  const recommendations = async (token, kind, id) =>
    (await get(token, `/${kind}/${id}/recommendations`, { language: 'pt-BR', page: 1 })).results || []

  return { ping, providers, discover, discoverWith, videos, seasonVideos, search, watchProviders, tvDetails, recommendations }
}

module.exports = { createTmdb }
