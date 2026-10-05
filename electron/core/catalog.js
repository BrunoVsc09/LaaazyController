// Converte respostas do TMDB para o formato do app. Único lugar que conhece os campos
// do TMDB: trocar de fonte de dados = trocar este arquivo e o adapter. Sem I/O.
const IMG = 'https://image.tmdb.org/t/p/'

// Nome do serviço no app → nomes que o TMDB usa (a HBO Max já se chamou "Max")
const SERVICE_NAMES = {
  Netflix: ['netflix'],
  'Prime Video': ['amazon prime video', 'prime video'],
  'HBO Max': ['hbo max', 'max'],
  Crunchyroll: ['crunchyroll'],
}

const KIND_LABEL = { tv: 'Série', movie: 'Filme' }

// Ids dos serviços resolvidos pelo nome exato (variações como "Netflix Basic with Ads" ficam de fora)
function resolveProviders(list) {
  const ids = {}
  for (const p of list || []) {
    const name = String(p.provider_name || '').toLowerCase()
    for (const [service, names] of Object.entries(SERVICE_NAMES)) {
      if (!(service in ids) && names.includes(name)) ids[service] = p.provider_id
    }
  }
  return ids
}

// Anime = animação (gênero 16) japonesa; ganha fileira própria no Início
const isAnime = (raw) => raw.original_language === 'ja' && (raw.genre_ids || []).includes(16)

// Série usa name/first_air_date; filme usa title/release_date
function toItem(raw, kind, service) {
  const tv = kind === 'tv'
  const title = tv ? raw.name : raw.title
  if (!title) return null
  return {
    id: `${kind}:${raw.id}`,
    kind: KIND_LABEL[kind],
    title,
    year: String((tv ? raw.first_air_date : raw.release_date) || '').slice(0, 4),
    overview: raw.overview || '',
    poster: raw.poster_path ? IMG + 'w342' + raw.poster_path : '',
    backdrop: raw.backdrop_path ? IMG + 'w1280' + raw.backdrop_path : '',
    popularity: raw.popularity || 0,
    services: service ? [service] : [],
    ...(isAnime(raw) ? { anime: true } : {}),
  }
}

// [{ service, results }] → itens sem repetição (somando serviços), do mais popular ao menos
function mergeLists(lists, kind, limit = 40) {
  const byId = new Map()
  for (const { service, results } of lists) {
    for (const raw of results || []) {
      const item = toItem(raw, kind, service)
      if (!item) continue
      const seen = byId.get(item.id)
      if (seen) { if (!seen.services.includes(service)) seen.services.push(service) } else byId.set(item.id, item)
    }
  }
  return [...byId.values()].sort((a, b) => b.popularity - a.popularity).slice(0, limit)
}

// Resultado de /search/multi: só séries e filmes (sem pessoas), do mais popular ao menos
function searchItems(results) {
  return (results || [])
    .filter((r) => r.media_type === 'tv' || r.media_type === 'movie')
    .map((r) => toItem(r, r.media_type))
    .filter(Boolean)
    .sort((a, b) => b.popularity - a.popularity)
}

// Provedores de assinatura no Brasil → serviços do app, na ordem do TMDB
function servicesFrom(providers) {
  const out = []
  for (const p of providers || []) {
    const name = String(p.provider_name || '').toLowerCase()
    const hit = Object.entries(SERVICE_NAMES).find(([, names]) => names.includes(name))
    if (hit && !out.includes(hit[0])) out.push(hit[0])
  }
  return out
}

// Melhor trailer do YouTube, preferindo português do Brasil (dublado ou legendado):
// idioma pesa mais que tipo (um teaser em português vence um trailer em inglês).
// Devolve { key, lang } ou null.
function trailerScore(v) {
  const lang = v.iso_639_1 === 'pt' ? (v.iso_3166_1 === 'BR' ? 300 : 200) : v.iso_639_1 === 'en' ? 100 : 50
  const type = v.type === 'Trailer' ? 20 : 10
  return lang + type + (v.official ? 1 : 0)
}

// Vários trailers, do melhor ao pior (no máximo 5): se um não tocar, o player tenta o próximo
function rankTrailers(videos) {
  const ok = (videos || []).filter((v) => v.site === 'YouTube' && v.key && (v.type === 'Trailer' || v.type === 'Teaser'))
  const seen = new Set()
  return ok
    .sort((a, b) => trailerScore(b) - trailerScore(a))
    .filter((v) => !seen.has(v.key) && seen.add(v.key))
    .slice(0, 5)
    .map((v) => ({ key: v.key, lang: v.iso_639_1 || '' }))
}

const pickTrailer = (videos) => rankTrailers(videos)[0] || null

function parseItemId(id) {
  const m = /^(tv|movie):(\d+)$/.exec(typeof id === 'string' ? id : '')
  return m ? { kind: m[1], id: Number(m[2]) } : null
}

module.exports = { SERVICE_NAMES, resolveProviders, toItem, mergeLists, searchItems, servicesFrom, pickTrailer, rankTrailers, parseItemId }
