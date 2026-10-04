// Jogos abertos recentemente ("Continuar jogando"). Sem I/O.
const MAX = 10

const pushRecent = (ids, id) => [id, ...ids.filter((x) => x !== id)].slice(0, MAX)

// Na ordem dos recentes; jogo que saiu da biblioteca some
const recentGames = (ids, games) => ids.map((id) => games.find((g) => g.id === id)).filter(Boolean)

module.exports = { pushRecent, recentGames }
