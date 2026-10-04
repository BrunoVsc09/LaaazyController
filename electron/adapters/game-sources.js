// Procura jogos no disco: Steam, Epic e pastas escolhidas por você.
const fs = require('fs')
const fsp = fs.promises
const path = require('path')
const steam = require('../core/games/steam')
const { parseEpicManifest } = require('../core/games/epic')
const { isGameExe, isSkippedDir } = require('../core/games/folder')

const readdir = (d, opts) => fsp.readdir(d, opts).catch(() => null)

async function scanSteam({ steamRoot }) {
  const root = await steamRoot()
  if (!root) return []
  const libs = new Set([root])
  try {
    const vdf = await fsp.readFile(path.join(root, 'steamapps', 'libraryfolders.vdf'), 'utf8')
    for (const p of steam.parseLibraryFolders(vdf)) libs.add(p)
  } catch {}
  const games = []
  for (const lib of libs) {
    const dir = path.join(lib, 'steamapps')
    for (const f of (await readdir(dir)) || []) {
      if (!steam.isManifestFile(f)) continue
      try {
        const g = steam.parseAppManifest(await fsp.readFile(path.join(dir, f), 'utf8'))
        if (g) games.push(g)
      } catch {}
    }
  }
  return games
}

async function scanEpic(dir) {
  const games = []
  for (const f of (await readdir(dir)) || []) {
    if (!f.endsWith('.item')) continue
    try {
      const g = parseEpicManifest(JSON.parse(await fsp.readFile(path.join(dir, f), 'utf8')))
      if (g) games.push(g)
    } catch {}
  }
  return games
}

// O .exe mais provável do jogo: o maior que não seja instalador, até 3 níveis abaixo
async function bestExe(dir, depth = 3) {
  let best = null
  let bestSize = 0
  async function walk(d, lvl) {
    for (const e of (await readdir(d, { withFileTypes: true })) || []) {
      const p = path.join(d, e.name)
      if (e.isDirectory()) {
        if (lvl < depth && !isSkippedDir(e.name)) await walk(p, lvl + 1)
      } else if (isGameExe(e.name)) {
        try { const s = (await fsp.stat(p)).size; if (s > bestSize) { bestSize = s; best = p } } catch {}
      }
    }
  }
  await walk(dir, 0)
  return best
}

// Se a pasta já é um jogo (tem .exe nela), vira um jogo. Senão, cada subpasta vira um jogo.
async function scanFolder(root) {
  const ents = (await readdir(root, { withFileTypes: true })) || []
  if (ents.some((e) => e.isFile() && isGameExe(e.name))) {
    const exe = await bestExe(root)
    return exe ? [{ name: path.basename(root), exe }] : []
  }
  const found = []
  for (const e of ents) {
    if (!e.isDirectory()) continue
    const exe = await bestExe(path.join(root, e.name))
    if (exe) found.push({ name: e.name, exe })
  }
  return found
}

module.exports = { scanSteam, scanEpic, scanFolder, bestExe }
