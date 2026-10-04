// Abre o que os cards pedem: sites (no app ou no Edge), navegadores e programas.
const { openMode } = require('../core/routing')

const BROWSERS = ['chrome', 'firefox']
const PROGRAMS = ['hydra', 'ds4windows']

function createLauncher({
  services, locator, ds4, spawnDetached, openPath, openExternal, openStream, setExternalActive, edgeProfileDir,
}) {
  // Perfil separado do Edge: força uma janela nova em tela cheia (Alt+F4 fecha)
  async function openInEdge(url) {
    const edge = await locator.findOrChoose('edge')
    if (!edge) return openExternal(url)
    return spawnDetached(edge, ['--kiosk', url, '--edge-kiosk-type=fullscreen', '--user-data-dir=' + edgeProfileDir, '--no-first-run'])
  }

  async function open(url, label) {
    ds4.applyFor(label)
    if (openMode(url, services) === 'edge') {
      setExternalActive(true)
      ds4.ensureRunning()
      return openInEdge(url)
    }
    openStream(url)
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
