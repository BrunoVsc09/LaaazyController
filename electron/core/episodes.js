// Aviso de episódio novo (saiu nos últimos 7 dias) ou chegando (próximos 7). Sem I/O.
const WINDOW_DAYS = 7
const DAY = 24 * 3600 * 1000

const parse = (d) => (/^\d{4}-\d{2}-\d{2}$/.test(d || '') ? Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10)) : NaN)
const code = (e) => `T${e.season_number}E${e.episode_number}`

// details: resposta de /tv/{id}; today: 'AAAA-MM-DD'
function episodeNews(details, today) {
  if (!details) return null
  const now = parse(today)
  const last = details.last_episode_to_air
  const next = details.next_episode_to_air
  const ago = last ? (now - parse(last.air_date)) / DAY : NaN
  if (ago >= 0 && ago <= WINDOW_DAYS) return { kind: 'new', date: last.air_date, label: `Episódio novo: ${code(last)}` }
  const ahead = next ? (parse(next.air_date) - now) / DAY : NaN
  if (ahead >= 0 && ahead <= WINDOW_DAYS) {
    const [, m, d] = next.air_date.split('-')
    return { kind: 'soon', date: next.air_date, label: `Episódio novo em ${d}/${m}: ${code(next)}` }
  }
  return null
}

module.exports = { episodeNews }
