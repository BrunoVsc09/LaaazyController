// Junta listas de jogos: o primeiro com cada id fica; resultado em ordem de nome.
function mergeGames(...lists) {
  const seen = new Set()
  return lists.flat()
    .filter((g) => (seen.has(g.id) ? false : seen.add(g.id)))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt'))
}

module.exports = { mergeGames }
