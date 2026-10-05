// Navegador de pastas do Laaazy (para escolher jogos com o controle). Sem I/O:
// recebe o que o disco devolveu e decide o que mostrar.
const path = require('path')

const MAX = 500
const GAME_FILE = /\.(exe|lnk)$/i
const HIDDEN = /^[.$]/ // .ocultas e $Recycle.Bin, $WinREAgent...

const isGameFile = (p) => GAME_FILE.test(String(p || ''))

// Só caminho absoluto de disco do Windows (C:\...), sem ".." e sem rede (\\servidor)
function isBrowsable(p) {
  if (typeof p !== 'string' || !/^[A-Za-z]:\\/.test(p)) return false
  return !p.split('\\').includes('..')
}

// Pasta de cima; na raiz do disco, null (volta para a lista de discos e atalhos)
function parentOf(p) {
  const parent = path.win32.dirname(p)
  return parent === p ? null : parent
}

// mode 'file': pastas + .exe/.lnk; mode 'dir': só pastas. Pastas primeiro, ordem alfabética.
function shapeEntries(dirents, dir, mode) {
  const byName = (a, b) => a.name.localeCompare(b.name, 'pt', { sensitivity: 'base' })
  const dirs = []
  const files = []
  for (const d of dirents) {
    if (HIDDEN.test(d.name)) continue
    const full = path.win32.join(dir, d.name)
    if (d.isDirectory()) dirs.push({ name: d.name, path: full, type: 'dir' })
    else if (mode === 'file' && d.isFile() && isGameFile(d.name)) files.push({ name: d.name, path: full, type: /\.lnk$/i.test(d.name) ? 'lnk' : 'exe' })
  }
  return [...dirs.sort(byName), ...files.sort(byName)].slice(0, MAX)
}

// Atalhos que existem neste PC
function places(env, exists) {
  const list = [
    { label: 'Downloads', path: env.USERPROFILE && path.win32.join(env.USERPROFILE, 'Downloads') },
    { label: 'Área de trabalho', path: env.USERPROFILE && path.win32.join(env.USERPROFILE, 'Desktop') },
    { label: 'Arquivos de Programas', path: env.ProgramFiles },
    { label: 'Arquivos de Programas (x86)', path: env['ProgramFiles(x86)'] },
  ]
  return list.filter((p) => p.path && exists(p.path))
}

const drives = (exists) =>
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((l) => `${l}:\\`).filter((d) => exists(d))

module.exports = { shapeEntries, parentOf, isBrowsable, isGameFile, places, drives, MAX }
