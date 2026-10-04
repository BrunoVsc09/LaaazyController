// Regras de caminho puras (sem acesso a disco: quem chama passa `exists`).
const path = require('path')

// Aceita a pasta do programa (ou o próprio .exe) e devolve o caminho do .exe
function resolveExeIn(p, exeName, exists) {
  if (!p) return null
  if (/\.exe$/i.test(p)) return exists(p) ? p : null
  for (const d of [p, path.join(p, 'Application'), path.join(p, '..')]) {
    const exe = path.join(d, exeName)
    if (exists(exe)) return exe
  }
  return null
}

module.exports = { resolveExeIn }
