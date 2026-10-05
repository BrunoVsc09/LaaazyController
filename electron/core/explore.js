// "Explorar sem digitar": escolhas da tela → parâmetros do /discover do TMDB. Sem I/O.
const opts = require('../../shared/explore-options')
const { GENRES } = require('./ai-filters')

const ids = (list) => list.map((x) => x.id)
const pick = (v, list, fallback) => (ids(list).includes(v) ? v : fallback)

// Só valores conhecidos; o resto volta ao padrão
function toSelection(sel) {
  const s = sel && typeof sel === 'object' ? sel : {}
  return {
    kind: pick(s.kind, opts.KINDS, 'any'),
    genre: pick(s.genre, opts.GENRES, ''),
    duration: pick(s.duration, opts.DURATIONS, 'any'),
    sort: pick(s.sort, opts.SORTS, 'popular'),
  }
}

const kindsFor = (sel) => (sel.kind === 'any' ? ['movie', 'tv'] : [sel.kind])

const RUNTIME = { short: { lte: 90 }, medium: { gte: 90, lte: 120 }, long: { gte: 120 } }

// null = esse tipo não tem a categoria escolhida (ex.: terror em séries): não buscar
function exploreParams(sel, kind, providerIds, today) {
  const p = { language: 'pt-BR', watch_region: 'BR', with_watch_monetization_types: 'flatrate', page: 1 }
  if (providerIds.length) p.with_watch_providers = providerIds.join('|')
  if (sel.genre) {
    const g = GENRES[sel.genre][kind]
    if (!g) return null
    p.with_genres = String(g)
  }
  const r = RUNTIME[sel.duration]
  if (kind === 'movie' && r) { // em séries a duração é por episódio: não vale
    if (r.gte) p['with_runtime.gte'] = r.gte
    if (r.lte) p['with_runtime.lte'] = r.lte
  }
  const date = kind === 'movie' ? 'primary_release_date' : 'first_air_date'
  if (sel.sort === 'recent') { // só já lançados e com algumas avaliações (sem lançamentos futuros e obscuros)
    p.sort_by = `${date}.desc`
    p[`${date}.lte`] = today
    p['vote_count.gte'] = 10
  } else if (sel.sort === 'rated') {
    p.sort_by = 'vote_average.desc'
    p['vote_count.gte'] = 200
  } else {
    p.sort_by = 'popularity.desc'
  }
  return p
}

module.exports = { toSelection, kindsFor, exploreParams }
