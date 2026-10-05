// Fecha o programa que está na frente (jogo, app, Edge) e volta ao menu.
const { shouldClose } = require('../core/processes')

// ancestorPids: quem abriu o Laaazy (terminal, app do Claude...) — nunca fecha esses
function createForeground({ fgInfo, ownPids, selfPid, showMenu, kill, ancestorPids = () => [], later = setTimeout }) {
  const ctx = () => ({ selfPid, ownPids: ownPids(), ancestorPids: ancestorPids() })
  async function closeCurrent() {
    const info = await fgInfo() // descobrir ANTES de trazer o menu para a frente
    showMenu()
    if (!shouldClose(info, ctx())) return false
    // 1) pede para fechar normalmente (dá chance de salvar)  2) se travar, força depois de 6s
    kill(info.pid, false)
    later(() => kill(info.pid, true), 6000)
    return true
  }
  // Botão PS: mata na hora (sem esperar o jogo salvar) e volta ao Início
  async function closeAndHome() {
    const info = await fgInfo() // descobrir ANTES de trazer o menu para a frente
    showMenu()
    if (!shouldClose(info, ctx())) return false
    kill(info.pid, true)
    return true
  }

  return { closeCurrent, closeAndHome }
}

module.exports = { createForeground }
