// Chamadas HTTP à YouTube Data API v3. A chave vai só no cabeçalho x-goog-api-key, nunca na URL.
const BASE = 'https://www.googleapis.com/youtube/v3/'
const TIMEOUT_MS = 10000

function createYoutube({ fetch = globalThis.fetch } = {}) {
  const signal = () => (typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(TIMEOUT_MS) : undefined)

  async function get(key, path, params) {
    const url = new URL(BASE + path)
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v))
    let res
    try {
      res = await fetch(url.toString(), { headers: { 'x-goog-api-key': key, Accept: 'application/json' }, signal: signal() })
    } catch { throw new Error('Sem conexão com o YouTube.') }
    if (res.ok) return res.json()
    let reason = ''
    try { reason = ((await res.json()).error.errors[0] || {}).reason || '' } catch {}
    if (/quota|rateLimit/i.test(reason)) throw Object.assign(new Error('A cota grátis do YouTube de hoje acabou.'), { code: 'quota' })
    throw new Error(`O YouTube recusou o pedido (erro ${res.status}).`)
  }

  const search = async (key, q) => ((await get(key, 'search', {
    part: 'snippet', type: 'video', videoEmbeddable: 'true', maxResults: 8, regionCode: 'BR', relevanceLanguage: 'pt', q,
  })).items || [])

  // A consulta mais barata (1 unidade) só para saber se a chave vale
  async function ping(key) {
    try { await get(key, 'videos', { part: 'id', id: 'dQw4w9WgXcQ' }); return true } catch { return false }
  }

  return { search, ping }
}

module.exports = { createYoutube }
