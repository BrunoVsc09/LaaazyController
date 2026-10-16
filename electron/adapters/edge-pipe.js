// Abre o Edge com o canal privado (--remote-debugging-pipe): o Laaazy escreve no fd 3 e lê o fd 4 do
// Edge. Só quem abriu enxerga o canal (sem porta aberta). Fino: a conversa fica no services/edge-tv.
const path = require('path')
const { spawn } = require('child_process')

function openPiped(exe, args) {
  const c = spawn(exe, args, { cwd: path.dirname(exe), stdio: ['ignore', 'ignore', 'ignore', 'pipe', 'pipe'] })
  const toEdge = c.stdio[3]
  const fromEdge = c.stdio[4]
  toEdge.on('error', () => {}) // Edge fechou no meio de uma escrita: o onExit avisa
  return {
    write: (text) => { if (toEdge.writable) toEdge.write(text) },
    onData: (cb) => fromEdge.on('data', (d) => cb(d.toString('utf8'))),
    onExit: (cb) => { c.on('exit', cb); c.on('error', cb) },
  }
}

module.exports = { openPiped }
