// Gera electron/preload.js e electron/stream-preload.js a partir dos *.src.js,
// embutindo os arquivos de shared/ (preloads em sandbox não podem importar arquivos).
const fs = require('fs')
const path = require('path')
const { inlineShared } = require('./inline-shared')

const ELECTRON = path.join(__dirname, '..', 'electron')
const read = (p) => fs.readFileSync(p, 'utf8')
const HEADER = '// ARQUIVO GERADO por scripts/build-preloads.js. Edite o .src.js correspondente.\n'

for (const name of ['preload', 'stream-preload']) {
  const src = read(path.join(ELECTRON, `${name}.src.js`))
  fs.writeFileSync(path.join(ELECTRON, `${name}.js`), HEADER + inlineShared(src, ELECTRON, read))
  console.log(`[preloads] electron/${name}.js gerado`)
}
