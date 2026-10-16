// Sistema: desliga o PC sem uso depois do tempo escolhido (Configurações → Sistema; padrão Nunca).
// Avisa 60 s antes (na tela, ou pelo Windows com o Laaazy escondido) e, com a opção ligada,
// não deixa o Windows suspender antes (suspenso, o Laaazy congela e não desligaria).
const { idleSeconds, decide, blocksSuspend } = require('../core/idle-shutdown')

const WARN_TEXT = 'O PC vai desligar em 1 minuto por falta de uso. Mexa no controle, no mouse ou no teclado para cancelar.'

// send({ seconds }) → tela (0 = tira o aviso); shutdown() desliga sem forçar;
// blocker = { start, stop } da suspensão do Windows
function createIdleShutdown({ hours, systemIdle, padIdle, shutdown, send, notify, focused, blocker }) {
  let warning = null
  let blocking = false
  let triedAt = null // o Windows não desligou: espera alguém usar antes de tentar de novo

  function syncBlocker(h) {
    if (blocksSuspend(h) === blocking) return
    blocking = !blocking
    if (blocking) blocker.start()
    else blocker.stop()
  }

  async function tick() {
    const h = hours()
    syncBlocker(h)
    const idle = idleSeconds(systemIdle(), padIdle())
    if (triedAt !== null) {
      if (idle >= triedAt) return
      triedAt = null
    }
    const d = decide({ hours: h, idle, warning })
    warning = d.warning
    if (d.action === 'warn' || d.action === 'countdown') send({ seconds: d.seconds })
    if (d.action === 'warn' && !focused()) notify(WARN_TEXT)
    if (d.action === 'cancel') send({ seconds: 0 })
    if (d.action === 'shutdown') {
      send({ seconds: 0 })
      triedAt = idle
      await shutdown()
    }
  }

  return { tick }
}

module.exports = { createIdleShutdown }
