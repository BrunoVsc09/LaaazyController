// Chamadas HTTP à API do TMDB (v3). A chave (API Read Access Token) vem de quem chama
// e só vai no cabeçalho Authorization; nunca em URL ou log.
const BASE = 'https://api.themoviedb.org/3'
const REGION = { watch_region: 'BR', language: 'pt-BR' }

function createTmdb({ fetch = globalThis.fetch } = {}) {
  async function get(token, path, params = {}) {
    const url = new URL(BASE + path)
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v))
    const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } })
    if (res.status === 401) throw new Error('O TMDB recusou a chave.')
    if (!res.ok) throw new Error(`O TMDB respondeu com erro ${res.status}.`)
    return res.json()
  }

  async function ping(token) {
    try { return !!(await get(token, '/authentication')).success } catch { return false }
  }

  const providers = async (token, kind) => (await get(token, `/watch/providers/${kind}`, REGION)).results || []

  const discover = async (token, kind, providerId) => (await get(token, `/discover/${kind}`, {
    ...REGION,
    with_watch_providers: providerId,
    with_watch_monetization_types: 'flatrate',
    sort_by: 'popularity.desc',
    page: 1,
  })).results || []

  const videos = async (token, kind, id) =>
    (await get(token, `/${kind}/${id}/videos`, { language: 'pt-BR', include_video_language: 'pt,en' })).results || []

  const search = async (token, query) =>
    (await get(token, '/search/multi', { query, language: 'pt-BR', include_adult: false, page: 1 })).results || []

  // Só os de assinatura (flatrate) no Brasil
  const watchProviders = async (token, kind, id) => {
    const br = ((await get(token, `/${kind}/${id}/watch/providers`)).results || {}).BR
    return (br && br.flatrate) || []
  }

  const tvDetails = (token, id) => get(token, `/tv/${id}`, { language: 'pt-BR' })

  return { ping, providers, discover, videos, search, watchProviders, tvDetails }
}

module.exports = { createTmdb }
