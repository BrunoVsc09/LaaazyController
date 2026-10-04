// Converte o caminho de uma URL app:// num arquivo dentro de out/. Sem I/O.
const path = require('path')

// null = recusar (URL malformada ou tentando sair da pasta)
function appFileFor(rawPath, root) {
  let p
  try { p = decodeURIComponent(rawPath) } catch { return null }
  if (p === '/') p = '/index.html'
  const file = path.normalize(path.join(root, p))
  // Sem o separador, "out-outra-coisa" passaria no teste por começar com "out"
  return file.startsWith(root + path.sep) ? file : null
}

module.exports = { appFileFor }
