// Navegador de pastas do Laaazy (para escolher jogos com o controle). Sem I/O:
// recebe o que o disco devolveu e decide o que mostrar.
const path = require('path')

const MAX = 500
const GAME_FILE = /\.(exe|lnk)$/i
const IMAGE_FILE = /\.(png|jpe?g)$/i // foto do perfil (boas-vindas); o Electron só lê PNG e JPG
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

// mode 'file': pastas + .exe/.lnk; 'image': pastas + fotos; 'dir': só pastas. Pastas primeiro, ordem alfabética.
function shapeEntries(dirents, dir, mode) {
  const byName = (a, b) => a.name.localeCompare(b.name, 'pt', { sensitivity: 'base' })
  const dirs = []
  const files = []
  for (const d of dirents) {
    if (HIDDEN.test(d.name)) continue
    const full = path.win32.join(dir, d.name)
    if (d.isDirectory()) dirs.push({ name: d.name, path: full, type: 'dir' })
    else if (mode === 'file' && d.isFile() && isGameFile(d.name)) files.push({ name: d.name, path: full, type: /\.lnk$/i.test(d.name) ? 'lnk' : 'exe' })
    else if (mode === 'image' && d.isFile() && IMAGE_FILE.test(d.name)) files.push({ name: d.name, path: full, type: 'image' })
  }
  return [...dirs.sort(byName), ...files.sort(byName)].slice(0, MAX)
}

// Atalhos que existem neste PC (no modo foto: onde ficam as fotos, sem pastas de programas).
// known: pastas de verdade que o Windows informa (ex.: Imagens e Área de trabalho no OneDrive)
function places(env, exists, mode, known = {}) {
  const home = (dir) => env.USERPROFILE && path.win32.join(env.USERPROFILE, dir)
  const pictures = known.pictures || home('Pictures')
  const desktop = known.desktop || home('Desktop')
  const downloads = known.downloads || home('Downloads')
  if (mode === 'image') {
    return [
      { label: 'Imagens', path: pictures },
      { label: 'Área de trabalho', path: desktop },
      { label: 'Downloads', path: downloads },
    ].filter((p) => p.path && exists(p.path))
  }
  const list = [
    { label: 'Downloads', path: downloads },
    { label: 'Área de trabalho', path: desktop },
    { label: 'Arquivos de Programas', path: env.ProgramFiles },
    { label: 'Arquivos de Programas (x86)', path: env['ProgramFiles(x86)'] },
  ]
  return list.filter((p) => p.path && exists(p.path))
}

const drives = (exists) =>
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((l) => `${l}:\\`).filter((d) => exists(d))

const isImageFile = (p) => IMAGE_FILE.test(String(p || ''))

module.exports = { shapeEntries, parentOf, isBrowsable, isGameFile, isImageFile, places, drives, MAX }
