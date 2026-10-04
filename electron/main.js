// Raiz de composição: cria adapters → serviços → IPC → janela. Sem regra de negócio aqui.
const { app, ipcMain, components, dialog, shell, globalShortcut, safeStorage } = require('electron')
const fs = require('fs')
const os = require('os')
const path = require('path')

const store = require('./adapters/json-store')
const { regAppPath, regValue } = require('./adapters/registry')
const { spawnDetached, killTree } = require('./adapters/process')
const { createForegroundProbe } = require('./adapters/ps-foreground')
const { createDialogs } = require('./adapters/dialogs')
const { createDs4Cli } = require('./adapters/ds4-cli')
const sources = require('./adapters/game-sources')
const { createTmdb } = require('./adapters/tmdb')
const { createSecretStore } = require('./adapters/secret-store')
const { createCatalog } = require('./services/catalog')
const { createSettings } = require('./services/settings')
const { createExeLocator } = require('./services/exe-locator')
const { createDs4 } = require('./services/ds4')
const { createLibrary } = require('./services/library')
const { createLauncher } = require('./services/launcher')
const { createForeground } = require('./services/foreground')
const { widevineStatus } = require('./core/drm')
const { planMigration } = require('./core/migration')
const { registerIpc } = require('./ipc/register')
const { registerAppScheme, handleAppProtocol } = require('./window/app-protocol')
const { createStreamView } = require('./window/stream-view')
const { createWindowManager } = require('./window/window-manager')
const C = require('../shared/channels')
const streaming = require('../shared/streaming')

const OUT = path.join(__dirname, '..', 'out')
const userFile = (name) => path.join(app.getPath('userData'), name)
const exists = (p) => fs.existsSync(p)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// O app mudou de nome (Lazy PS4 → Laaazy) e a pasta de dados mudou junto:
// copia as configurações da pasta antiga uma vez, antes de qualquer serviço ler
function migrateOldData() {
  const list = (d) => { try { return fs.readdirSync(d) } catch { return [] } }
  const newDir = app.getPath('userData')
  const candidates = ['lazy-ps4', 'Lazy PS4']
    .map((n) => path.join(app.getPath('appData'), n))
    .filter((d) => d !== newDir)
    .map((dir) => ({ dir, files: list(dir) }))
  const plan = planMigration({ candidates, newFiles: list(newDir) })
  if (!plan) return
  fs.mkdirSync(newDir, { recursive: true })
  for (const f of plan.files) {
    try { fs.copyFileSync(path.join(plan.from, f), path.join(newDir, f)) } catch (e) { console.warn('[migração]', f, e.message) }
  }
}
migrateOldData()

registerAppScheme()

// ---- Janela e camada de streaming ----
let externalActive = false
const stream = createStreamView({ getWin: () => windows.get(), preload: path.join(__dirname, 'stream-preload.js') })
const windows = createWindowManager({
  preload: path.join(__dirname, 'preload.js'),
  onResize: () => stream.fit(),
  onClosed: () => stream.forget(),
  // Voltou do Edge/navegador para o menu: volta o perfil do Menu
  onFocus: () => { if (externalActive) { externalActive = false; if (!closeDs4OnMenu()) ds4.applyFor('menu') } },
})

// ---- Serviços ----
const settings = createSettings({
  read: () => store.readJsonSync(userFile('settings.json'), {}),
  write: (data) => store.writeJsonSync(userFile('settings.json'), data),
})
const closeDs4OnMenu = () => settings.get('closeDs4OnMenu') !== false
const dialogs = createDialogs({ dialog, getWin: () => windows.get() })
const locator = createExeLocator({ settings, exists, regAppPath, chooseDir: dialogs.chooseDir, showError: dialogs.showError })
const ds4 = createDs4({
  cli: createDs4Cli({ openPath: (p) => shell.openPath(p) }),
  getExe: () => locator.find('ds4windows'),
  readCfg: () => store.readJson(userFile('ds4-profiles.json'), {}),
  writeCfg: (cfg) => store.writeJson(userFile('ds4-profiles.json'), cfg),
  sleep,
})

async function steamRoot() {
  const saved = await regValue('HKCU\\Software\\Valve\\Steam', 'SteamPath')
  const cands = [saved, 'C:\\Program Files (x86)\\Steam', 'C:\\Program Files\\Steam']
  return cands.find((c) => c && exists(path.join(c, 'steamapps'))) || null
}
const epicManifests = path.join(process.env.ProgramData || 'C:\\ProgramData', 'Epic', 'EpicGamesLauncher', 'Data', 'Manifests')

const library = createLibrary({
  sources: [() => sources.scanSteam({ steamRoot }), () => sources.scanEpic(epicManifests)],
  readCustom: () => store.readJson(userFile('games.json'), []),
  writeCustom: (list) => store.writeJson(userFile('games.json'), list),
  scanFolder: sources.scanFolder,
  chooseExe: dialogs.chooseExe,
  chooseDir: () => dialogs.chooseDir('Escolha a pasta dos jogos'),
  exists,
  openExternal: (url) => shell.openExternal(url),
  openPath: (p) => shell.openPath(p),
  spawnDetached,
  onLaunch: () => ds4.ensureRunning(),
})

const launcher = createLauncher({
  services: streaming, locator, ds4, spawnDetached,
  openPath: (p) => shell.openPath(p),
  openExternal: (url) => shell.openExternal(url),
  openStream: (url) => stream.open(url),
  setExternalActive: (v) => { externalActive = v },
  edgeProfileDir: userFile('edge-tv'),
  streamModes: () => settings.get('streamModes'),
  widevine: () => widevineStatus(components.status()),
})

// Filmes e séries (TMDB). A chave fica criptografada em secrets.json; o cache em catalog-cache.json.
const catalog = createCatalog({
  tmdb: createTmdb(),
  secrets: createSecretStore({
    safeStorage,
    read: () => store.readJsonSync(userFile('secrets.json'), {}),
    write: (data) => store.writeJsonSync(userFile('secrets.json'), data),
  }),
  readCache: async () => {
    const c = await store.readJson(userFile('catalog-cache.json'), {})
    return c.at ? c : null
  },
  writeCache: (c) => store.writeJson(userFile('catalog-cache.json'), c || {}),
})

// ---- Menu e botão PS ----
function goHome() {
  stream.close()
  if (!closeDs4OnMenu()) ds4.applyFor('menu')
}

function showMenu() {
  goHome()
  windows.send(C.GO_HOME) // fecha Biblioteca / telas de configuração
  windows.bringToFront()
  // Botão PS: fecha o DS4Windows (dá tempo de o F24 chegar antes)
  if (closeDs4OnMenu()) setTimeout(() => ds4.shutdown(), 500)
}

const probe = createForegroundProbe()
const foreground = createForeground({
  fgInfo: probe.info,
  ownPids: () => app.getAppMetrics().map((m) => m.pid),
  selfPid: process.pid,
  showMenu,
  kill: killTree,
})

registerIpc(ipcMain, {
  launcher, locator, settings, ds4, library, catalog, goHome,
  back: () => { if (!stream.back()) goHome() },
  sendKey: (key) => stream.sendKey(key),
  quit: () => app.quit(),
  takeWarnings: store.takeWarnings,
  systemUser: () => ({ name: os.userInfo().username }),
  drmStatus: () => widevineStatus(components.status()),
})

app.whenReady().then(async () => {
  await components.whenReady() // instala o Widevine (DRM)
  handleAppProtocol(OUT)
  windows.create('app://local/index.html')
  ds4.ensureRunning()  // abre o DS4Windows em segundo plano
  ds4.applyFor('menu') // e carrega o perfil do Menu

  // No DS4Windows, mapeie o botão PS para F24 (menu) e outro botão para F23 (fechar o da frente)
  for (const key of ['F24', 'CommandOrControl+Alt+Home']) {
    try { globalShortcut.register(key, showMenu) } catch {}
  }
  for (const key of ['F23', 'CommandOrControl+Alt+End']) {
    try { globalShortcut.register(key, () => foreground.closeCurrent()) } catch {}
  }
  probe.warm()
})

app.on('will-quit', () => { globalShortcut.unregisterAll(); probe.dispose() })
app.on('window-all-closed', () => app.quit())
