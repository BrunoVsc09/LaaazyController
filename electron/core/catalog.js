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
    services: [service],
  }
}

// [{ service, results }] → itens sem repetição (somando serviços), do mais popular ao menos
function mergeLists(lists, kind, limit = 20) {
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

// Trailer oficial do YouTube > qualquer trailer do YouTube > teaser do YouTube
function pickTrailer(videos) {
  const yt = (videos || []).filter((v) => v.site === 'YouTube')
  const best = yt.find((v) => v.type === 'Trailer' && v.official) || yt.find((v) => v.type === 'Trailer') || yt.find((v) => v.type === 'Teaser')
  return best ? best.key : null
}

function parseItemId(id) {
  const m = /^(tv|movie):(\d+)$/.exec(typeof id === 'string' ? id : '')
  return m ? { kind: m[1], id: Number(m[2]) } : null
}

module.exports = { SERVICE_NAMES, resolveProviders, toItem, mergeLists, pickTrailer, parseItemId }
