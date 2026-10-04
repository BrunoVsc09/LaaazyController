// Fecha o programa que está na frente (jogo, app, Edge) e volta ao menu.
const { shouldClose } = require('../core/processes')

function createForeground({ fgInfo, ownPids, selfPid, showMenu, kill, later = setTimeout }) {
  async function closeCurrent() {
    const info = await fgInfo() // descobrir ANTES de trazer o menu para a frente
    showMenu()
    if (!shouldClose(info, { selfPid, ownPids: ownPids() })) return false
    // 1) pede para fechar normalmente (dá chance de salvar)  2) se travar, força depois de 6s
    kill(info.pid, false)
    later(() => kill(info.pid, true), 6000)
    return true
  }
  return { closeCurrent }
}

module.exports = { createForeground }
