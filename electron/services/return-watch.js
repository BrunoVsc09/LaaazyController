// Depois de abrir um jogo ou o Edge, volta ao Laaazy sozinho quando ele fecha.
const { startWatch, watchStep } = require('../core/focus')

function createReturnWatch({ fgInfo, ownPids, selfPid, onReturn, now = Date.now }) {
  let state = { phase: 'idle' }
  let busy = false
  // Teclado por cima aberto: a janela dele é do Laaazy, mas o usuário continua no Edge
  let held = false

  const start = () => { state = startWatch(now()) }
  const stop = () => { state = { phase: 'idle' } }

  // Chamado de tempos em tempos; parado, não pergunta nada ao Windows
  async function tick() {
    if (state.phase === 'idle' || busy) return
    busy = true
    try {
      const info = await fgInfo()
      if (held) return
      const r = watchStep(state, info, { selfPid, ownPids: ownPids() }, now())
      state = r.state
      if (r.action === 'return') onReturn()
    } finally { busy = false }
  }

  const hold = () => { held = true }
  const release = () => { held = false }

  return { start, stop, tick, hold, release }
}

module.exports = { createReturnWatch }
