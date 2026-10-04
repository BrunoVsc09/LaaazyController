// Coloca o conteúdo de require('../shared/x') dentro do arquivo. Preloads rodam em
// sandbox e só podem fazer require('electron'); assim eles usam o mesmo código da tela.
const path = require('path')

const SHARED_REQUIRE = /require\('(\.\.\/shared\/[\w-]+)'\)/g

function inlineShared(source, fromDir, read) {
  return source.replace(SHARED_REQUIRE, (_m, rel) => {
    const code = read(path.join(fromDir, rel + '.js'))
    return `(function () { const module = { exports: {} }; const exports = module.exports;\n${code}\nreturn module.exports })()`
  })
}

module.exports = { inlineShared }
