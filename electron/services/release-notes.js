// Novidades da versão: depois que o Laaazy se atualiza, a tela mostra o que mudou (uma vez por versão).
const core = require('../core/release-notes')

function createReleaseNotes({ version, readChangelog, isNewUser, settings }) {
  const seen = async () => { settings.set('lastSeenVersion', version()) }

  async function pending() {
    const current = version()
    // Primeira instalação: aparecem as boas-vindas; já marca como vista (senão aparecia na 2ª abertura)
    if (await isNewUser()) { await seen(); return null }
    if (!core.shouldShow({ lastSeen: settings.get('lastSeenVersion'), current, newUser: false })) return null
    try {
      return core.notesFor(await readChangelog(), current)
    } catch {
      return null
    }
  }

  return { pending, seen }
}

module.exports = { createReleaseNotes }
