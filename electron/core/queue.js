// Fila serial: uma tarefa por vez. Tarefa que passar do tempo limite é abandonada
// (devolve onTimeout()) para nada ficar preso na fila para sempre.
function createQueue({ timeoutMs, onTimeout }) {
  let tail = Promise.resolve()
  function run(task) {
    const guarded = () => {
      let timer
      const limit = new Promise((res) => { timer = setTimeout(() => res(onTimeout()), timeoutMs) })
      return Promise.race([Promise.resolve().then(task), limit]).finally(() => clearTimeout(timer))
    }
    const p = tail.then(guarded)
    tail = p.catch(() => {})
    return p
  }
  return { run }
}

module.exports = { createQueue }
