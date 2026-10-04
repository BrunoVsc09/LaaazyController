// Abre o que os cards pedem: sites (no app ou no Edge), navegadores e programas.
const { openMode, serviceForUrl } = require('../core/routing')

const BROWSERS = ['chrome', 'firefox']
const PROGRAMS = ['hydra', 'ds4windows']

function createLauncher({
  services, locator, ds4, spawnDetached, openPath, openExternal, openStream, setExternalActive, edgeProfileDir,
  streamModes = () => ({}), widevine = () => ({ installed: true }),
}) {
  // Perfil próprio do Laaazy (guarda os logins), janela de app em tela cheia (Alt+F4 fecha).
  // Sem --kiosk: o modo quiosque do Edge é sempre InPrivate e esquece os logins.
  async function openInEdge(url) {
    const edge = await locator.findOrChoose('edge')
    if (!edge) return openExternal(url)
    return spawnDetached(edge, ['--user-data-dir=' + edgeProfileDir, '--no-first-run', '--start-fullscreen', '--app=' + url])
  }

  // Devolve '' quando abriu, ou a mensagem para mostrar na tela
  async function open(url, label) {
    if (openMode(url, services, streamModes()) === 'edge') {
      ds4.applyFor(label)
      setExternalActive(true)
      ds4.ensureRunning()
      return (await openInEdge(url)) || ''
    }
    const service = serviceForUrl(url, services)
    const drm = widevine()
    if (service && service.drm && !drm.installed) return drm.msg
    ds4.applyFor(label)
    openStream(url)
    return ''
  }

  // Devolve '' quando abriu, ou a mensagem de erro
  async function launch(name) {
    const program = locator.programs[name]
    if (!program || ![...BROWSERS, ...PROGRAMS].includes(name)) return 'Programa desconhecido.'
    const exe = await locator.findOrChoose(name)
    if (!exe) return `Não achei o ${program.label}.`
    if (PROGRAMS.includes(name)) return (await openPath(exe)) || ''
    // Navegador precisa do perfil de mouse do DS4Windows
    setExternalActive(true)
    ds4.ensureRunning()
    ds4.applyFor(program.label)
    return spawnDetached(exe, [])
  }

  return { open, launch }
}

module.exports = { createLauncher }
