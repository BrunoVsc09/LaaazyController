// Confere o app.asar do .exe portátil: tem tudo o que o Laaazy precisa e nada que não deveria.
// Uso: node scripts/package-check.js [dist/win-unpacked/resources/app.asar]
const fs = require('fs')
const path = require('path')

const REQUIRED = [
  'package.json',
  'electron/main.js', 'electron/preload.js', 'electron/stream-preload.js',
  'electron/core/security.js', 'shared/channels.js',
  'out/index.html', 'out/keyboard.html',
]
// Testes, fontes dos preloads (o pacote leva os gerados), qualquer segredo e node_modules
// (o Electron só usa módulos do Node; a tela já vem pronta em out/)
const FORBIDDEN = [/^node_modules\//, /\.test\.js$/, /\.src\.js$/, /(^|\/)secrets\.json$/, /(^|\/)\.env/]

// Lista de arquivos do pacote → problemas encontrados ([] = tudo certo)
function problemsIn(files) {
  const norm = files.map((f) => f.replace(/\\/g, '/').replace(/^\//, ''))
  const have = new Set(norm)
  return [
    ...REQUIRED.filter((f) => !have.has(f)).map((f) => `falta ${f}`),
    ...norm.filter((f) => FORBIDDEN.some((re) => re.test(f))).map((f) => `sobra ${f}`),
  ]
}

// Lê o índice do .asar (cabeçalho em JSON depois de 16 bytes) sem dependências
function listAsar(file) {
  const fd = fs.openSync(file, 'r')
  try {
    const head = Buffer.alloc(16)
    fs.readSync(fd, head, 0, 16, 0)
    const jsonLen = head.readUInt32LE(12)
    const json = Buffer.alloc(jsonLen)
    fs.readSync(fd, json, 0, jsonLen, 16)
    const out = []
    const walk = (node, prefix) => {
      for (const [name, child] of Object.entries(node.files || {})) {
        const p = `${prefix}/${name}`
        if (child.files) walk(child, p)
        else out.push(p)
      }
    }
    walk(JSON.parse(json.toString('utf8')), '')
    return out
  } finally { fs.closeSync(fd) }
}

if (require.main === module) {
  const file = process.argv[2] || path.join(__dirname, '..', 'dist', 'win-unpacked', 'resources', 'app.asar')
  const files = listAsar(file)
  const problems = problemsIn(files)
  console.log(`${files.length} arquivos em ${file}`)
  if (problems.length) { console.log(problems.join('\n')); process.exit(1) }
  console.log('Pacote OK')
}

module.exports = { problemsIn, listAsar, REQUIRED }
