// Detecta jogos instalados (Steam, Epic) e gerencia jogos adicionados à mão.
const fs = require('fs')
const fsp = fs.promises
const path = require('path')
const { execFile, spawn } = require('child_process')
const { readJson, writeJson } = require('./store')

const SKIP_STEAM = /Redistributable|Steamworks|Runtime|Proton|Steam Controller|Steam Linux/i
const BAD_EXE = /unins|setup|crash|redist|dxsetup|dotnet|updater|helper|easyanticheat|eac_|cef|benchmark|notification|report/i
const SKIP_DIR = /^(_redist|redist|__installer|directx|engine|\.)/i

function regQuery(args) {
  return new Promise((res) => execFile('reg', args, { windowsHide: true }, (e, out) => res(e ? '' : String(out))))
}

async function steamRoot() {
  const out = await regQuery(['query', 'HKCU\\Software\\Valve\\Steam', '/v', 'SteamPath'])
  const m = out.match(/SteamPath\s+REG_SZ\s+(.+)/)
  const cands = [m && m[1].trim(), 'C:\\Program Files (x86)\\Steam', 'C:\\Program Files\\Steam']
  for (const c of cands) if (c && fs.existsSync(path.join(c, 'steamapps'))) return c
  return null
}

async function scanSteam() {
  const root = await steamRoot()
  if (!root) return []
  const libs = new Set([root])
  try {
    const vdf = await fsp.readFile(path.join(root, 'steamapps', 'libraryfolders.vdf'), 'utf8')
    for (const m of vdf.matchAll(/"path"\s+"([^"]+)"/g)) libs.add(m[1].replace(/\\\\/g, '\\'))
  } catch {}
  const games = []
  for (const lib of libs) {
    let files = []
    try { files = await fsp.readdir(path.join(lib, 'steamapps')) } catch { continue }
    for (const f of files) {
      if (!/^appmanifest_\d+\.acf$/.test(f)) continue
      try {
        const t = await fsp.readFile(path.join(lib, 'steamapps', f), 'utf8')
        const id = (t.match(/"appid"\s+"(\d+)"/) || [])[1]
        const name = (t.match(/"name"\s+"([^"]+)"/) || [])[1]
        if (!id || !name || SKIP_STEAM.test(name)) continue
        games.push({
          id: 'steam:' + id, name, platform: 'Steam',
          launch: { type: 'url', value: 'steam://rungameid/' + id },
          cover: `https://cdn.akamai.steamstatic.com/steam/apps/${id}/header.jpg`,
        })
      } catch {}
    }
  }
  return games
}

async function scanEpic() {
  const dir = path.join(process.env.ProgramData || 'C:\\ProgramData', 'Epic', 'EpicGamesLauncher', 'Data', 'Manifests')
  let files = []
  try { files = await fsp.readdir(dir) } catch { return [] }
  const games = []
  for (const f of files) {
    if (!f.endsWith('.item')) continue
    try {
      const j = JSON.parse(await fsp.readFile(path.join(dir, f), 'utf8'))
      if (!j.DisplayName || !j.AppName) continue
      if (Array.isArray(j.AppCategories) && !j.AppCategories.includes('games')) continue
      const key = encodeURIComponent(`${j.CatalogNamespace}:${j.CatalogItemId}:${j.AppName}`)
      games.push({
        id: 'epic:' + j.AppName, name: j.DisplayName, platform: 'Epic Games',
        launch: { type: 'url', value: `com.epicgames.launcher://apps/${key}?action=launch&silent=true` },
      })
    } catch {}
  }
  return games
}

// Acha o .exe mais provável do jogo dentro de uma pasta (o maior que não seja instalador).
async function bestExe(dir, depth = 3) {
  let best = null, bestSize = 0
  async function walk(d, lvl) {
    let ents
    try { ents = await fsp.readdir(d, { withFileTypes: true }) } catch { return }
    for (const e of ents) {
      const p = path.join(d, e.name)
      if (e.isDirectory()) {
        if (lvl < depth && !SKIP_DIR.test(e.name)) await walk(p, lvl + 1)
      } else if (/\.exe$/i.test(e.name) && !BAD_EXE.test(e.name)) {
        try { const s = (await fsp.stat(p)).size; if (s > bestSize) { bestSize = s; best = p } } catch {}
      }
    }
  }
  await walk(dir, 0)
  return best
}

async function hasTopExe(dir) {
  try {
    return (await fsp.readdir(dir)).some((n) => /\.exe$/i.test(n) && !BAD_EXE.test(n))
  } catch { return false }
}

// Se a pasta já é um jogo (tem .exe nela), adiciona ela. Senão, cada subpasta vira um jogo.
async function scanFolder(root) {
  if (await hasTopExe(root)) {
    const exe = await bestExe(root)
    return exe ? [{ name: path.basename(root), exe }] : []
  }
  const found = []
  let ents = []
  try { ents = await fsp.readdir(root, { withFileTypes: true }) } catch { return found }
  for (const e of ents) {
    if (!e.isDirectory()) continue
    const exe = await bestExe(path.join(root, e.name))
    if (exe) found.push({ name: e.name, exe })
  }
  return found
}

module.exports = function register({ ipcMain, app, dialog, shell, getWin, onLaunch }) {
  const store = () => path.join(app.getPath('userData'), 'games.json')
  const readCustom = () => readJson(store(), [])
  const writeCustom = (list) => writeJson(store(), list)

  // Varrer Steam e Epic lê o disco inteiro. Antes isso acontecia a cada
  // games:list E de novo a cada games:launch, só para achar um id na lista.
  // Agora o resultado vale por 15s e é jogado fora quando a lista muda.
  let cache = null
  let cacheAt = 0
  const CACHE_MS = 15000
  const dropCache = () => { cache = null }

  async function all({ fresh = false } = {}) {
    if (!fresh && cache && Date.now() - cacheAt < CACHE_MS) return cache
    const custom = (await readCustom()).map((g) => ({
      id: g.id, name: g.name, platform: 'Meu PC', launch: { type: 'exe', value: g.exe },
    }))
    const [steam, epic] = await Promise.all([scanSteam(), scanEpic()])
    const seen = new Set()
    cache = [...steam, ...epic, ...custom]
      .filter((g) => (seen.has(g.id) ? false : seen.add(g.id)))
      .sort((a, b) => a.name.localeCompare(b.name, 'pt'))
    cacheAt = Date.now()
    return cache
  }

  async function addCustom(items) {
    const list = await readCustom()
    let added = 0
    for (const it of items) {
      const id = 'pc:' + it.exe.toLowerCase()
      if (!list.some((g) => g.id === id)) { list.push({ id, name: it.name, exe: it.exe }); added++ }
    }
    const ok = await writeCustom(list)
    dropCache()
    return { added, ok }
  }

  ipcMain.handle('games:list', (_e, opts) => all(opts))

  // Devolve { ok, msg }. Antes devolvia `true` mesmo quando o .exe não existia
  // mais e o erro do spawn era engolido: você apertava X e não acontecia nada,
  // sem nenhuma mensagem na tela.
  ipcMain.handle('games:launch', async (_e, id) => {
    const g = (await all()).find((x) => x.id === id)
    if (!g) return { ok: false, msg: 'Esse jogo não está mais na lista. Volte e entre na Biblioteca de novo.' }
    if (g.launch.type === 'url') {
      if (!/^(steam|com\.epicgames\.launcher):\/\//.test(g.launch.value)) {
        return { ok: false, msg: 'Endereço de abertura inválido para este jogo.' }
      }
      try { onLaunch && onLaunch() } catch {}
      try {
        await shell.openExternal(g.launch.value)
      } catch (e) {
        return { ok: false, msg: `Não consegui abrir pela ${g.platform}: ${e.message}` }
      }
      return { ok: true, msg: '' }
    }
    if (!fs.existsSync(g.launch.value)) {
      dropCache()
      return { ok: false, msg: `O arquivo do jogo não existe mais:\n${g.launch.value}` }
    }
    try { onLaunch && onLaunch() } catch {}
    const err = await new Promise((res) => {
      let c
      try {
        c = spawn(g.launch.value, [], { cwd: path.dirname(g.launch.value), detached: true, stdio: 'ignore' })
      } catch (e) { return res(e.message) }
      c.on('error', (e) => res(e.message))
      c.unref()
      // Se em 400ms nenhum erro chegou, o processo subiu
      setTimeout(() => res(''), 400)
    })
    return err ? { ok: false, msg: `Não consegui abrir "${g.name}": ${err}` } : { ok: true, msg: '' }
  })

  ipcMain.handle('games:addExe', async () => {
    const r = await dialog.showOpenDialog(getWin(), {
      title: 'Escolha o executável do jogo', properties: ['openFile'],
      filters: [{ name: 'Programas', extensions: ['exe', 'lnk'] }],
    })
    if (r.canceled || !r.filePaths[0]) return { ok: true, added: 0, msg: '' }
    const exe = r.filePaths[0]
    const { added, ok } = await addCustom([{ name: path.basename(exe).replace(/\.[^.]+$/, ''), exe }])
    if (!ok) return { ok: false, added: 0, msg: 'Não consegui salvar a lista de jogos.' }
    return { ok: true, added, msg: added ? '' : 'Esse jogo já estava na lista.' }
  })

  ipcMain.handle('games:addFolder', async () => {
    const r = await dialog.showOpenDialog(getWin(), { title: 'Escolha a pasta dos jogos', properties: ['openDirectory'] })
    if (r.canceled || !r.filePaths[0]) return { ok: true, added: 0, msg: '' }
    const found = await scanFolder(r.filePaths[0])
    if (!found.length) return { ok: true, added: 0, msg: 'Não achei nenhum jogo nessa pasta.' }
    const { added, ok } = await addCustom(found)
    if (!ok) return { ok: false, added: 0, msg: 'Não consegui salvar a lista de jogos.' }
    return { ok: true, added, msg: added ? `${added} jogo(s) adicionado(s).` : 'Todos os jogos dessa pasta já estavam na lista.' }
  })

  ipcMain.handle('games:remove', async (_e, id) => {
    const ok = await writeCustom((await readCustom()).filter((g) => g.id !== id))
    dropCache()
    return { ok, msg: ok ? '' : 'Não consegui salvar a lista de jogos.' }
  })
}

module.exports.scanFolder = scanFolder
