// pnpm dist (antes do electron-builder): gera o Laaazy-pad pelo script do projeto dele
// (scripts/publicar.ps1, sem -Instalar: o código dele não é tocado) e copia para build/laaazy-pad,
// que o instalador leva para resources/laaazy-pad. Precisa do dotnet neste PC.
const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')

const ROOT = path.join(__dirname, '..')
const REQUIRED = ['LaaazyPad.exe', 'LaaazyPadCmd.exe', 'SDL3.dll', 'SDL3-LICENSE.txt', 'PerfisPadrao/Jogos.json', 'PerfisPadrao/PC.json']
// Profiles ao lado do exe = modo portátil: os perfis ficariam na pasta do Laaazy e a atualização apagaria
const FORBIDDEN = [/^Profiles\//i, /\.pem$/i, /\.pdb$/i]

// Arquivos da pasta (relativos) → problemas ([] = pode ir no instalador)
function padProblems(files) {
  const norm = files.map((f) => f.replace(/\\/g, '/'))
  const have = new Set(norm)
  return [
    ...REQUIRED.filter((f) => !have.has(f)).map((f) => `falta ${f}`),
    ...norm.filter((f) => FORBIDDEN.some((re) => re.test(f))).map((f) => `sobra ${f}`),
  ]
}

function paths(root = ROOT, env = process.env) {
  const project = env.LAAAZY_PAD_DIR || path.join(root, '..', 'laaazy-pad')
  return { project, published: path.join(project, 'publicado', 'Laaazy-pad'), bundle: path.join(root, 'build', 'laaazy-pad') }
}

const listFiles = (dir) => fs.readdirSync(dir, { recursive: true, withFileTypes: true })
  .filter((d) => d.isFile())
  .map((d) => path.relative(dir, path.join(d.parentPath ?? d.path, d.name)))

function main() {
  const { project, published, bundle } = paths()
  const script = path.join(project, 'scripts', 'publicar.ps1')
  if (!fs.existsSync(script)) throw new Error(`Não achei o projeto do Laaazy-pad em ${project} (ou defina LAAAZY_PAD_DIR).`)
  execFileSync('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', script], { stdio: 'inherit' })
  const problems = padProblems(listFiles(published))
  if (problems.length) throw new Error(`O Laaazy-pad publicado não está completo:\n${problems.join('\n')}`)
  fs.rmSync(bundle, { recursive: true, force: true })
  fs.cpSync(published, bundle, { recursive: true })
  console.log(`Laaazy-pad pronto para o instalador: ${path.relative(ROOT, bundle)} (${listFiles(bundle).length} arquivos)`)
}

if (require.main === module) {
  try { main() } catch (e) { console.error(e.message); process.exit(1) }
}

module.exports = { padProblems, paths, listFiles }
