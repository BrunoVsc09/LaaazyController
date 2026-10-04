// Quando o app mudou de nome (Lazy PS4 → Laaazy), a pasta de dados mudou junto.
// Decide o que copiar da pasta antiga. Sem I/O.

// secrets.json fica de fora: a chave do TMDB é criptografada com uma chave guardada
// na pasta antiga do app, então ela não abriria na pasta nova (cole a chave de novo).
const MIGRATABLE = ['settings.json', 'ds4-profiles.json', 'games.json', 'catalog-cache.json']

// candidates: [{ dir, files }] em ordem de preferência; newFiles: o que já existe na pasta nova
function planMigration({ candidates, newFiles }) {
  for (const { dir, files } of candidates) {
    const found = MIGRATABLE.filter((f) => files.includes(f))
    if (!found.length) continue
    const missing = found.filter((f) => !newFiles.includes(f))
    return missing.length ? { from: dir, files: missing } : null
  }
  return null
}

module.exports = { MIGRATABLE, planMigration }
