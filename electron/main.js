// Raiz de composição: cria adapters → serviços → IPC → janela. Sem regra de negócio aqui.
const { app, ipcMain, components, dialog, shell, globalShortcut, safeStorage, clipboard, Menu, session, screen } = require('electron')
const fs = require('fs')
const os = require('os')
const { execFile } = require('child_process')
const path = require('path')

const store = require('./adapters/json-store')
const { regAppPath, regValue } = require('./adapters/registry')
const { spawnDetached, killTree, processTable } = require('./adapters/process')
const { ancestorsOf, parseProcessTable } = require('./core/processes')
const { MASK_MENU } = require('./core/focus')
const { createForegroundProbe } = require('./adapters/ps-foreground')
const { createDialogs } = require('./adapters/dialogs')
const { createLaaazyPadCli } = require('./adapters/laaazy-pad-cli')
const sources = require('./adapters/game-sources')
const { createTmdb } = require('./adapters/tmdb')
const { createSecretStore } = require('./adapters/secret-store')
const { createCatalog } = require('./services/catalog')
const { createSgdb } = require('./adapters/sgdb')
const { createYoutube } = require('./adapters/youtube')
const { createYtTrailers } = require('./services/yt-trailers')
const { createCovers } = require('./services/covers')
const { createMyList } = require('./services/my-list')
const { createGemini } = require('./adapters/gemini')
const { createAssistant } = require('./services/assistant')
const { createPower } = require('./services/power')
const { createVolume } = require('./services/volume')
const { SHORTCUTS: VOLUME_SHORTCUTS } = require('./core/volume')
const { createKeySender } = require('./adapters/ps-keys')
const { loginItemFor } = require('./core/power')
const { pushRecent, recentGames } = require('./core/recent')
const { createSettings } = require('./services/settings')
const { createExeLocator } = require('./services/exe-locator')
const { createDs4 } = require('./services/ds4')
const { createDesktop } = require('./services/desktop')
const { createCursorLock } = require('./services/cursor-lock')
const { createLibrary } = require('./services/library')
const { createUserProfile } = require('./services/user-profile')
const { createAvatarImage } = require('./adapters/avatar-image')
const { createLauncher } = require('./services/launcher')
const { createForeground } = require('./services/foreground')
const { createReturnWatch } = require('./services/return-watch')
const { createPsButton } = require('./services/ps-button')
const { createTextEntry } = require('./services/text-entry')
const { createFileBrowser } = require('./adapters/file-browser')
const { editCommand } = require('./core/typing')
const { createKeyboardOverlay } = require('./window/keyboard-overlay')
const { widevineStatus } = require('./core/drm')
const { planMigration } = require('./core/migration')
const { cleanKey } = require('./core/keys')
const { EMBED_URLS, refererFor } = require('./core/youtube')
const { registerIpc } = require('./ipc/register')
const { registerAppScheme, handleAppProtocol } = require('./window/app-protocol')
const { allowPermission } = require('./core/security')
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

// Laaazy abre uma vez só: abrir de novo só traz o que já está aberto para a frente
if (!app.requestSingleInstanceLock()) app.quit()

// Sem barra de menu: o truque de foco aperta Alt, e o Alt mostraria File/Edit/View.
// De novo no 'ready' (o Electron põe o menu padrão nessa hora) e na própria janela.
Menu.setApplicationMenu(null)

registerAppScheme()

const probe = createForegroundProbe()

// ---- Janela e camada de streaming ----
let externalActive = false
const stream = createStreamView({ getWin: () => windows.get(), preload: path.join(__dirname, 'stream-preload.js') })
const ICON = path.join(__dirname, 'assets', 'icon.ico')
const windows = createWindowManager({
  preload: path.join(__dirname, 'preload.js'),
  icon: ICON,
  onResize: () => stream.fit(),
  // Fechou a janela principal: fecha o Laaazy (a janela escondida do teclado por cima não pode
  // deixar o programa vivo sem janela; o atalho cairia nessa instância e nada abriria)
  onClosed: () => { stream.forget(); app.quit() },
  // Voltou do Edge/navegador para o menu: volta o perfil do Menu
  forceFocus: (hwnd) => probe.focus(hwnd),
  // Laaazy na frente: cursor preso nele; saiu da frente: cursor solto
  onBlur: () => cursorLock.unlock(),
  onFocus: () => { cursorLock.lock(); desktop.leave(); if (externalActive) { externalActive = false; ds4.applyFor('menu') } },
})

// Cursor preso na janela do Laaazy enquanto ele está na frente (Configurações: lockCursor)
const cursorLock = createCursorLock({
  send: (cmd) => probe.run(cmd),
  bounds: () => {
    const w = windows.get()
    if (!w) return null
    const r = screen.dipToScreenRect(w, w.getBounds()) // pixels de tela (com a escala do Windows)
    return { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) }
  },
  enabled: () => settings.get('lockCursor') !== false,
})
// O Windows solta o cursor em algumas trocas de janela: reaplica enquanto o Laaazy está na frente
setInterval(() => { const w = windows.get(); if (w && w.isFocused()) cursorLock.lock() }, 2000).unref()

// Tira o Laaazy da frente (jogo aberto ou Área de trabalho); bringToFront traz de volta
function hideLaaazy() {
  const w = windows.get()
  if (w) { w.setAlwaysOnTop(false); w.minimize() }
}

// ---- Serviços ----
const settings = createSettings({
  read: () => store.readJsonSync(userFile('settings.json'), {}),
  write: (data) => store.writeJsonSync(userFile('settings.json'), data),
})
const dialogs = createDialogs({ dialog, getWin: () => windows.get() })
const locator = createExeLocator({ settings, exists, regAppPath, chooseDir: dialogs.chooseDir, showError: dialogs.showError })
const ds4 = createDs4({
  cli: createLaaazyPadCli({ openPath: (p) => shell.openPath(p) }),
  getExe: () => locator.find('laaazypad'),
  readCfg: () => store.readJson(userFile('ds4-profiles.json'), {}),
  writeCfg: (cfg) => store.writeJson(userFile('ds4-profiles.json'), cfg),
  sleep,
  readyDelayMs: 300, // o Laaazy-pad aceita comandos ~300 ms depois de abrir (medido)
})

// Perfil de quem usa o Laaazy (boas-vindas): nome, foto (autoral em out/avatars ou a do PC) e boas-vindas
const userProfile = createUserProfile({
  read: () => store.readJson(userFile('user.json'), {}),
  write: (data) => store.writeJson(userFile('user.json'), data),
  systemName: () => os.userInfo().username,
  avatarFiles: () => fs.promises.readdir(path.join(OUT, 'avatars')),
  image: createAvatarImage({ file: userFile('avatar.png') }),
  choosePhoto: () => dialogs.chooseImage(),
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
  // Antes de abrir o jogo: Laaazy-pad aberto com o perfil do jogo (ou o padrão dos jogos)
  onLaunch: (id) => { ds4.ensureRunning(); ds4.applyForGame(id); returnWatch.start() },
  // Continuar jogando: guarda o jogo aberto na frente da lista
  onLaunched: async (id) => {
    // O Laaazy sai da frente: em tela cheia e com foco, o Windows deixava o jogo abrir atrás dele.
    // A volta automática (ou o PS) traz o Laaazy de volta quando o jogo fecha ou não aparece.
    setTimeout(hideLaaazy, 1500)
    const ids = await store.readJson(userFile('recent.json'), [])
    await store.writeJson(userFile('recent.json'), pushRecent(ids, id))
  },
})
// Energia. "Abrir junto com o Windows" usa o .exe real (no portátil, não a pasta temporária)
const loginItem = () => loginItemFor({
  isPackaged: app.isPackaged, execPath: process.execPath,
  portableFile: process.env.PORTABLE_EXECUTABLE_FILE || '', appPath: app.getAppPath(),
})
const power = createPower({
  exec: (cmd, args) => new Promise((res) => execFile(cmd, args, { windowsHide: true }, (e) => res(e ? e.message : ''))),
  quit: () => app.quit(),
  getLogin: () => app.getLoginItemSettings(loginItem()).openAtLogin,
  setLogin: (openAtLogin) => { app.setLoginItemSettings({ openAtLogin, ...loginItem() }); return true },
})

// Volume do Windows (PowerShell em segundo plano apertando as teclas de volume)
const keySender = createKeySender()
const volume = createVolume({ send: keySender.send })

const myList = createMyList({
  read: () => store.readJson(userFile('my-list.json'), []),
  write: (list) => store.writeJson(userFile('my-list.json'), list),
})

// Perfil do DS4 do app que está aberto (streaming, Área de trabalho): o teclado por cima troca
// para o perfil dele e devolve este ao fechar
let appProfileKey = 'menu'
const ds4ForApps = { ...ds4, applyFor: (key) => { appProfileKey = key; return ds4.applyFor(key) } }

const launcher = createLauncher({
  services: streaming, locator, ds4: ds4ForApps, spawnDetached,
  openPath: (p) => shell.openPath(p),
  openExternal: (url) => shell.openExternal(url),
  openStream: (url) => stream.open(url),
  setExternalActive: (v) => { externalActive = v; if (v) returnWatch.start() },
  edgeProfileDir: userFile('edge-tv'),
  streamModes: () => settings.get('streamModes'),
  edgeNoGpu: () => settings.get('edgeNoGpu') || [],
  widevine: () => widevineStatus(components.status()),
})

// Capas do SteamGridDB para jogos da Epic e do PC (chave em secrets.json, cache em covers.json)
const secretStore = createSecretStore({
  safeStorage,
  read: () => store.readJsonSync(userFile('secrets.json'), {}),
  write: (data) => store.writeJsonSync(userFile('secrets.json'), data),
})
const covers = createCovers({
  sgdb: createSgdb(), secrets: secretStore,
  readCache: () => store.readJson(userFile('covers.json'), {}),
  writeCache: (c) => store.writeJson(userFile('covers.json'), c),
})
const libraryWithCovers = { ...library, list: async (opts) => covers.fill(await library.list(opts)) }

// Trailers dublados/legendados pelo YouTube (chave opcional, criptografada como as outras)
const ytTrailers = createYtTrailers({
  yt: createYoutube(), secrets: secretStore,
  readCache: () => store.readJson(userFile('yt-trailers.json'), {}),
  writeCache: (c) => store.writeJson(userFile('yt-trailers.json'), c),
  readUsage: () => store.readJson(userFile('yt-usage.json'), {}),
  writeUsage: (u) => store.writeJson(userFile('yt-usage.json'), u),
})

// Filmes e séries (TMDB). A chave fica criptografada em secrets.json; o cache em catalog-cache.json.
const catalog = createCatalog({
  tmdb: createTmdb(),
  secrets: secretStore,
  findPt: (item) => ytTrailers.find(item),
  readCache: async () => {
    const c = await store.readJson(userFile('catalog-cache.json'), {})
    return c.at ? c : null
  },
  writeCache: (c) => store.writeJson(userFile('catalog-cache.json'), c || {}),
})

// Gemini: "Parecido com este" (△ no Início). Uso do dia em ai-usage.json
const assistant = createAssistant({
  gemini: createGemini(), tmdb: createTmdb(), secrets: secretStore,
  model: () => settings.get('geminiModel'),
  readUsage: () => store.readJson(userFile('ai-usage.json'), {}),
  writeUsage: (u) => store.writeJson(userFile('ai-usage.json'), u),
})

// ---- Menu e botão PS ----
function goHome() {
  stream.close()
  ds4.applyFor('menu')
}

function showMenu() {
  desktop.leave()
  goHome()
  windows.send(C.GO_HOME) // fecha Biblioteca / telas de configuração
  windows.bringToFront()
}

const foreground = createForeground({
  fgInfo: probe.info,
  ownPids: () => app.getAppMetrics().map((m) => m.pid),
  selfPid: process.pid,
  showMenu,
  kill: killTree,
  ancestorPids: () => laaazyAncestors,
})
// Quem abriu o Laaazy (terminal do "pnpm app", app do Claude...): o PS nunca fecha esses,
// porque fechar com /T levaria o Laaazy junto
let laaazyAncestors = []

// Botão PS: mata o que está na frente e volta ao Início (showMenu)
const psButton = createPsButton({
  foreground,
  home: () => showMenu(),
  psClosesApp: () => settings.get('psClosesApp') !== false,
  ensureDs4: () => ds4.ensureRunning(),
  notifyTested: () => windows.send(C.PS_TESTED),
  desktopActive: () => desktop.isActive(),
})

// Teclado do Laaazy por cima do Edge (Share no perfil PC / Ctrl+Alt+K): digita no campo selecionado
const keyboardOverlay = createKeyboardOverlay({ preload: path.join(__dirname, 'preload.js'), url: 'app://local/keyboard.html', icon: ICON })
const textEntry = createTextEntry({
  maskMenu: () => probe.run(MASK_MENU),
  // Controle sem mouse enquanto o teclado está aberto (Perfis do controle → Teclado por cima)
  profileIn: () => ds4.applyFor('keyboard'),
  profileOut: () => ds4.applyFor(appProfileKey),
  fgHwnd: probe.hwnd,
  // A volta automática pausa com o teclado aberto (a janela dele é do Laaazy) e retoma
  // depois que o Edge volta para a frente
  // O cursor fica preso dentro do teclado: no perfil PC o X também é clique do mouse, e um clique
  // em cima do Edge tirava o foco do teclado depois da 1ª tecla
  showOverlay: () => {
    returnWatch.hold()
    keyboardOverlay.show()
    setTimeout(() => cursorLock.confine(keyboardOverlay.screenBounds()), 200)
  },
  hideOverlay: () => {
    keyboardOverlay.hide()
    cursorLock.unlock()
    setTimeout(() => returnWatch.release(), 2000)
  },
  // Tempo real: cada mudança do teclado (apagar N + texto) vai na hora para o campo do site
  sendEdit: (change) => { const cmd = editCommand(change); if (!cmd) return false; keySender.send(cmd); return true },
})

// Jogo ou Edge fechou: o Laaazy volta sozinho para a frente, no Início
const returnWatch = createReturnWatch({
  fgInfo: probe.info,
  ownPids: () => app.getAppMetrics().map((m) => m.pid),
  selfPid: process.pid,
  onReturn: () => showMenu(),
})
setInterval(() => returnWatch.tick(), 1500).unref()

// Botão "Área de trabalho" do Início
const desktop = createDesktop({ ds4: ds4ForApps, returnWatch, minimize: hideLaaazy })

registerIpc(ipcMain, {
  launcher, locator, settings, ds4, library: libraryWithCovers, catalog, myList, power, covers, volume, assistant, psButton, textEntry, goHome, desktop, ytTrailers,
  browse: createFileBrowser(),
  // Botão Colar das chaves: texto copiado, já limpo de espaços (só quando você aperta)
  readClipboard: () => cleanKey(clipboard.readText()).slice(0, 500),
  recentGames: async () => recentGames(await store.readJson(userFile('recent.json'), []), await libraryWithCovers.list()),
  back: () => { if (!stream.back()) goHome() },
  sendKey: (key) => stream.sendKey(key),
  quit: () => app.quit(),
  takeWarnings: store.takeWarnings,
  user: userProfile,
  drmStatus: () => widevineStatus(components.status()),
})

app.on('second-instance', () => showMenu())

app.whenReady().then(async () => {
  Menu.setApplicationMenu(null)
  // Prévia de trailer no Início: o player do YouTube precisa saber de qual app vem
  session.defaultSession.webRequest.onBeforeSendHeaders({ urls: EMBED_URLS }, (d, cb) => {
    const referer = refererFor(d.url)
    if (referer) d.requestHeaders.Referer = referer
    cb({ requestHeaders: d.requestHeaders })
  })
  // Sites e a tela só recebem tela cheia e DRM; câmera, microfone, localização etc. ficam negados
  session.defaultSession.setPermissionRequestHandler((_wc, permission, cb) => cb(allowPermission(permission)))
  session.defaultSession.setPermissionCheckHandler((_wc, permission) => allowPermission(permission))
  await components.whenReady() // instala o Widevine (DRM)
  handleAppProtocol(OUT)
  windows.create('app://local/index.html')
  // O Laaazy-pad abre junto e fica aberto o tempo todo: sem controle virtual, ele não atrapalha a
  // leitura do controle no menu, e o PS (Ctrl+Alt+Home) funciona sempre
  ds4.ensureRunning()  // abre o Laaazy-pad em segundo plano
  ds4.applyFor('menu') // e carrega o perfil do Menu

  // O Laaazy-pad manda o PS como Ctrl+Alt+Home e o Share (perfil PC) como Ctrl+Alt+K;
  // Ctrl+Alt+End (fechar o que está na frente) fica para o teclado
  const shortcuts = [
    ['CommandOrControl+Alt+Home', () => psButton.press()],
    ['CommandOrControl+Alt+End', () => foreground.closeCurrent()],
    ['CommandOrControl+Alt+K', () => textEntry.open()],
  ]
  for (const [key, fn] of shortcuts) {
    try { globalShortcut.register(key, fn) } catch {}
  }
  for (const { accel, action } of VOLUME_SHORTCUTS) {
    try { globalShortcut.register(accel, () => volume.step(action)) } catch {}
  }
  probe.warm()
  processTable().then((t) => { laaazyAncestors = ancestorsOf(parseProcessTable(t), process.pid) })
})

app.on('before-quit', () => cursorLock.unlock())
// Fechar o Laaazy fecha o Laaazy-pad junto: segura a saída até ele fechar (no máximo 4 s)
let padClosed = false
app.on('will-quit', (e) => {
  if (!padClosed) {
    e.preventDefault()
    padClosed = true
    Promise.race([ds4.shutdown(), sleep(4000)]).finally(() => app.quit())
    return
  }
  globalShortcut.unregisterAll(); probe.dispose(); keySender.dispose()
})
app.on('window-all-closed', () => app.quit())
