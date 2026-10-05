// Trailer dublado ou legendado em português, buscado direto no YouTube (o TMDB cadastra poucos).
// Sem I/O: monta a busca e escolhe, entre os resultados, os vídeos que são mesmo o trailer do título.
const MAX_YT = 3
const MAX_ALL = 6
const VIDEO_ID = /^[A-Za-z0-9_-]{1,20}$/
// Reações, análises, resumos e vídeos de fã não são o trailer
const NOT_TRAILER = /\b(reag\w*|react\w*|reacao|analise|explicad\w*|resumo|review|fan ?made|comentando|teoria\w*)\b/

const ENTITIES = { '&quot;': '"', '&#39;': "'", '&amp;': '&', '&lt;': '<', '&gt;': '>' }
const decode = (s) => String(s || '').replace(/&(quot|#39|amp|lt|gt);/g, (m) => ENTITIES[m])
const norm = (s) => decode(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

// Uma busca por título (cada busca custa 1/100 da cota diária grátis)
function searchQuery({ title, year }) {
  const t = String(title || '').trim()
  if (!t) return ''
  return [t, String(year || '').trim(), 'trailer dublado legendado'].filter(Boolean).join(' ')
}

// Resultados do search.list → [{ key, lang: 'pt', label: 'dublado' | 'legendado' }], melhor primeiro
function rankYoutube(results, item) {
  const want = ` ${norm(item.title)} `
  const scored = []
  for (const r of results || []) {
    const key = r && r.id && r.id.kind === 'youtube#video' ? r.id.videoId : null
    if (!key || !VIDEO_ID.test(key)) continue
    const title = ` ${norm(r.snippet && r.snippet.title)} `
    if (!title.includes(want) || !/ (trailer|teaser) /.test(title) || NOT_TRAILER.test(title)) continue
    const label = / dublad[oa] /.test(title) ? 'dublado' : / legendad[oa] /.test(title) ? 'legendado' : null
    if (!label) continue
    const official = / brasil | br /.test(` ${norm(r.snippet.channelTitle)} `) ? 1 : 0
    scored.push({ key, label, score: (label === 'dublado' ? 10 : 5) + official })
  }
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_YT)
    .map(({ key, label }) => ({ key, lang: 'pt', label }))
}

// YouTube em português primeiro, depois os do TMDB, sem repetir
function mergeTrailers(fromYt, fromTmdb) {
  const seen = new Set()
  return [...(fromYt || []), ...(fromTmdb || [])].filter((t) => !seen.has(t.key) && seen.add(t.key)).slice(0, MAX_ALL)
}

module.exports = { searchQuery, rankYoutube, mergeTrailers }
