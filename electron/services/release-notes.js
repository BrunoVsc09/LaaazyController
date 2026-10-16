// Novidades da versão: depois que o Laaazy se atualiza, a tela mostra o que mudou (uma vez por versão).
const core = require('../core/release-notes')

// artFiles(): arquivos da pasta novidades (a imagem grande de cada versão)
function createReleaseNotes({ version, readChangelog, artFiles, isNewUser, settings }) {
  const seen = async () => { settings.set('lastSeenVersion', version()) }

  async function pending() {
    const current = version()
    // Primeira instalação: aparecem as boas-vindas; já marca como vista (senão aparecia na 2ª abertura)
    if (await isNewUser()) { await seen(); return null }
    if (!core.shouldShow({ lastSeen: settings.get('lastSeenVersion'), current, newUser: false })) return null
    let notes
    try {
      notes = core.notesFor(await readChangelog(), current)
    } catch {
      return null
    }
    if (!notes) return null
    const files = await artFiles().catch(() => [])
    return { ...notes, art: core.artFor(current, files) }
  }

  return { pending, seen }
}

module.exports = { createReleaseNotes }
