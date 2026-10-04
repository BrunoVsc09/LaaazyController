const { app, BrowserWindow, WebContentsView, ipcMain, protocol, net, components, dialog, shell, globalShortcut } = require('electron')
const path = require('path')
const fs = require('fs')
const { pathToFileURL } = require('url')
const { spawn, execFile } = require('child_process')

// >>> AJUSTE AQUI: caminhos dos programas do seu PC <<<
const os = require('os')
const APPS = {
  hydra: path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Hydra', 'Hydra.exe'),
  ds4windows: 'C:\\Users\\bruno\\Downloads\\win-x64\\DS4Windows.exe',
}

// Sites que dão erro de DRM no app abrem no Edge em tela cheia (Alt+F4 fecha)
const EXTERNAL = ['crunchyroll.com']

// ---- Onde está o Edge (msedge.exe) ----
const { readJsonSync, writeJsonSync, takeWarnings } = require('./adapters/json-store')
const settingsFile = () => path.join(app.getPath('userData'), 'settings.json')
const readSettings = () => readJsonSync(settingsFile(), {})
const closeOnMenu = () => readSettings().closeDs4OnMenu !== false // padrão: ligado
const writeSettings = (patch) => writeJsonSync(settingsFile(), { ...readSettings(), ...patch })

// Aceita a pasta do Edge (ou o próprio msedge.exe) e devolve o caminho do msedge.exe
function resolveEdgeExe(p) {
  if (!p) return null
  if (/\.exe$/i.test(p)) return fs.existsSync(p) ? p : null
  for (const d of [p, path.join(p, 'Application'), path.join(p, '..')]) {
    const exe = path.join(d, 'msedge.exe')
    if (fs.existsSync(exe)) return exe
  }
  return null
}

function regEdgePath() {
  return new Promise((res) =>
    execFile('reg', ['query', 'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\msedge.exe', '/ve'],
      { windowsHide: true }, (e, out) => { const m = !e && String(out).match(/REG_SZ\s+(.+)/); res(m ? m[1].trim() : null) }))
}

async function findEdge() {
  const saved = resolveEdgeExe(readSettings().edgePath)
  if (saved) return saved
  const cands = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    await regEdgePath(),
  ]
  return cands.find((c) => c && fs.existsSync(c)) || null
}

async function chooseEdge() {
  const r = await dialog.showOpenDialog(alive() ? win : null, {
    title: 'Escolha a pasta do Edge (onde fica o msedge.exe)',
    properties: ['openDirectory'],
  })
  if (r.canceled || !r.filePaths[0]) return null
  const exe = resolveEdgeExe(r.filePaths[0])
  if (!exe) {
    dialog.showErrorBox('Edge não encontrado', 'Não achei o msedge.exe nessa pasta. Escolha a pasta que contém o msedge.exe (normalmente ...\\Microsoft\\Edge\\Application).')
    return null
  }
  writeSettings({ edgePath: r.filePaths[0] })
  return exe
}

async function openInEdge(url) {
  let edge = await findEdge()
  if (!edge) edge = await chooseEdge() // não achou: pergunta a pasta
  if (!edge) return shell.openExternal(url)
  // Perfil separado do Edge (força uma janela nova em tela cheia). Você entra na conta uma vez.
  const profile = path.join(app.getPath('userData'), 'edge-tv')
  const c = spawn(edge, ['--kiosk', url, '--edge-kiosk-type=fullscreen', '--user-data-dir=' + profile, '--no-first-run'], { detached: true, stdio: 'ignore' })
  c.on('error', () => {})
  c.unref()
}

const ds4 = require('./ds4')({ ipcMain, app, shell, exe: APPS.ds4windows })
let externalActive = false

// ---- Chrome e Firefox (abrem como navegador normal) ----
const BROWSERS = {
  chrome: {
    label: 'Google Chrome', exe: 'chrome.exe', setting: 'chromePath',
    defaults: [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    ],
  },
  firefox: {
    label: 'Firefox', exe: 'firefox.exe', setting: 'firefoxPath',
    defaults: [
      'C:\\Program Files\\Mozilla Firefox\\firefox.exe',
      'C:\\Program Files (x86)\\Mozilla Firefox\\firefox.exe',
    ],
  },
}

function resolveExeIn(p, exeName) {
  if (!p) return null
  if (/\.exe$/i.test(p)) return fs.existsSync(p) ? p : null
  for (const d of [p, path.join(p, 'Application'), path.join(p, '..')]) {
    const exe = path.join(d, exeName)
    if (fs.existsSync(exe)) return exe
  }
  return null
}

function regAppPath(exeName) {
  return new Promise((res) =>
    execFile('reg', ['query', `HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\${exeName}`, '/ve'],
      { windowsHide: true }, (e, out) => { const m = !e && String(out).match(/REG_SZ\s+(.+)/); res(m ? m[1].trim() : null) }))
}

async function findBrowser(key) {
  const b = BROWSERS[key]
  const saved = resolveExeIn(readSettings()[b.setting], b.exe)
  if (saved) return saved
  const cands = [...b.defaults, await regAppPath(b.exe)]
  return cands.find((c) => c && fs.existsSync(c)) || null
}

async function chooseBrowser(key) {
  const b = BROWSERS[key]
  const r = await dialog.showOpenDialog(alive() ? win : null, { title: `Escolha a pasta do ${b.label} (onde fica o ${b.exe})`, properties: ['openDirectory'] })
  if (r.canceled || !r.filePaths[0]) return null
  const exe = resolveExeIn(r.filePaths[0], b.exe)
  if (!exe) { dialog.showErrorBox(`${b.label} não encontrado`, `Não achei o ${b.exe} nessa pasta.`); return null }
  writeSettings({ [b.setting]: r.filePaths[0] })
  return exe
}

async function launchBrowser(key) {
  const b = BROWSERS[key]
  const exe = (await findBrowser(key)) || (await chooseBrowser(key))
  if (!exe) return `Não achei o ${b.label}.`
  externalActive = true
  ds4.ensureRunning()   // navegador precisa do perfil de mouse do DS4Windows
  ds4.applyFor(b.label)
  const c = spawn(exe, [], { cwd: path.dirname(exe), detached: true, stdio: 'ignore' })
  c.on('error', () => {})
  c.unref()
  return ''
}

const OUT = path.join(__dirname, '..', 'out')
let win = null
let view = null

// Verdadeiro só quando dá para mexer na janela. Depois que ela é fechada, o
// objeto continua existindo mas qualquer método dele lança exceção.
const alive = () => !!win && !win.isDestroyed()

// Traz o menu para a frente (funciona por cima de jogos e do Edge)
function showMenu() {
  if (!alive()) return
  goHome()
  win.webContents.send('go-home') // fecha Biblioteca / tela de perfis
  if (win.isMinimized()) win.restore()
  win.setAlwaysOnTop(true)
  win.show()
  win.moveTop()
  win.focus()
  win.setFullScreen(true)
  // Se o Steam (ou outro app) roubar o foco logo depois, pega de volta
  for (const ms of [350, 900]) {
    setTimeout(() => {
      if (alive() && !win.isFocused()) { win.setAlwaysOnTop(true); win.show(); win.focus(); win.setAlwaysOnTop(false) }
    }, ms)
  }
  setTimeout(() => alive() && win.setAlwaysOnTop(false), 1200)
  // Botão PS: fecha o DS4Windows (dá tempo de o F24 chegar antes)
  if (closeOnMenu()) setTimeout(() => ds4.shutdown(), 500)
}

// ---- Fechar o que está na frente (jogo / app / Edge) e voltar ao menu ----
// Um PowerShell fica aberto em segundo plano só para descobrir qual programa está em primeiro plano.
let ps = null
function startPs() {
  if (ps) return
  try {
    ps = spawn('powershell.exe', ['-NoLogo', '-NoProfile', '-NonInteractive', '-Command', '-'], { windowsHide: true })
    ps.stdout.setEncoding('utf8')
    ps.on('error', () => { ps = null })
    ps.on('exit', () => { ps = null })
    ps.stdin.write("Add-Type -TypeDefinition 'using System;using System.Runtime.InteropServices;public class FG{[DllImport(\"user32.dll\")]public static extern IntPtr GetForegroundWindow();[DllImport(\"user32.dll\")]public static extern uint GetWindowThreadProcessId(IntPtr h,out uint p);}'\n")
  } catch { ps = null }
}

function fgInfo() {
  return new Promise((resolve) => {
    startPs()
    if (!ps) return resolve({ pid: 0, name: '' })
    let buf = ''
    const done = (v) => { clearTimeout(tm); if (ps) ps.stdout.off('data', onData); resolve(v) }
    const onData = (d) => {
      buf += d
      const m = buf.match(/FGPID:(\d+):(\S*)\r?\n/)
      if (m) done({ pid: Number(m[1]), name: m[2] })
    }
    const tm = setTimeout(() => done({ pid: 0, name: '' }), 3000)
    ps.stdout.on('data', onData)
    ps.stdin.write('$p=0;[void][FG]::GetWindowThreadProcessId([FG]::GetForegroundWindow(),[ref]$p);$n=(Get-Process -Id $p -ErrorAction SilentlyContinue).ProcessName;"FGPID:${p}:$n"\n')
  })
}

// Nunca fecha estes (o próprio app, o Windows, o Steam e o DS4Windows)
const PROTECTED = new Set(['explorer', 'steam', 'steamwebhelper', 'ds4windows', 'dwm', 'csrss', 'winlogon',
  'searchhost', 'searchapp', 'shellexperiencehost', 'startmenuexperiencehost', 'applicationframehost',
  'textinputhost', 'lockapp', 'sihost', 'electron', 'lazy-ps4', 'lazy ps4'])

async function closeCurrent() {
  const { pid, name } = await fgInfo() // descobrir ANTES de trazer o menu para a frente
  const own = app.getAppMetrics().map((m) => m.pid)
  showMenu()
  if (!pid || pid === process.pid || own.includes(pid) || PROTECTED.has(name.toLowerCase())) return
  // 1) pede para fechar normalmente (dá chance de salvar)  2) se travar, força depois de 6 segundos
  execFile('taskkill', ['/PID', String(pid), '/T'], { windowsHide: true }, () => {})
  setTimeout(() => execFile('taskkill', ['/PID', String(pid), '/T', '/F'], { windowsHide: true }, () => {}), 6000)
}

function goHome() {
  closeStream()
  if (!closeOnMenu()) ds4.applyFor('menu')
}

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } },
])

function fitView() {
  if (!alive() || !view) return
  const [width, height] = win.getContentSize()
  view.setBounds({ x: 0, y: 0, width, height })
}

function closeStream() {
  if (!view) return
  const v = view
  view = null // zera antes, para um segundo closeStream não mexer no mesmo view
  try {
    if (alive()) win.contentView.removeChildView(v)
    v.webContents.close()
  } catch {}
  if (alive()) win.webContents.focus()
}

function openStream(url) {
  if (!alive()) return
  closeStream()
  view = new WebContentsView({
    webPreferences: {
      partition: 'persist:streaming', // mantém seus logins
      preload: path.join(__dirname, 'stream-preload.js'),
    },
  })
  const wc = view.webContents
  wc.setUserAgent(wc.getUserAgent().replace(/ ?(Electron|lazy-ps4)\/\S+/g, ''))
  wc.setWindowOpenHandler(({ url: u }) => { wc.loadURL(u); return { action: 'deny' } })
  win.contentView.addChildView(view)
  fitView()
  wc.loadURL(url)
  wc.focus()
}

app.whenReady().then(async () => {
  await components.whenReady() // instala o Widevine (DRM)

  protocol.handle('app', (req) => {
    let p = decodeURIComponent(new URL(req.url).pathname)
    if (p === '/') p = '/index.html'
    const file = path.normalize(path.join(OUT, p))
    // Sem o separador, "out-outra-coisa" passaria no teste por começar com "out"
    if (file !== OUT && !file.startsWith(OUT + path.sep)) return new Response('not found', { status: 404 })
    return net.fetch(pathToFileURL(file).toString())
  })

  win = new BrowserWindow({
    fullscreen: true,
    autoHideMenuBar: true,
    backgroundColor: '#0b3f9d',
    webPreferences: { preload: path.join(__dirname, 'preload.js') },
  })
  win.setMenuBarVisibility(false)
  win.on('resize', fitView)
  win.on('enter-full-screen', fitView)
  win.on('leave-full-screen', fitView)
  // Sem isto, `win` continua apontando para uma janela destruída e todo
  // showMenu()/fitView() posterior lança exceção
  win.on('closed', () => { win = null; view = null })
  win.on('focus', () => { if (externalActive) { externalActive = false; if (!closeOnMenu()) ds4.applyFor('menu') } })
  win.loadURL('app://local/index.html')
  ds4.ensureRunning()  // abre o DS4Windows em segundo plano
  ds4.applyFor('menu') // e carrega o perfil do Menu (padrão: Brunera)

  ipcMain.on('open', (_e, url, label) => {
    ds4.applyFor(label)
    try {
      const h = new URL(url).hostname
      if (EXTERNAL.some((d) => h === d || h.endsWith('.' + d))) { externalActive = true; ds4.ensureRunning(); return openInEdge(url) }
    } catch {}
    openStream(url)
  })
  ipcMain.on('home', goHome)
  ipcMain.on('back', () => {
    const h = view && view.webContents.navigationHistory
    if (h && h.canGoBack()) h.goBack()
    else goHome()
  })
  ipcMain.on('key', (_e, keyCode) => {
    if (!view) return
    view.webContents.sendInputEvent({ type: 'keyDown', keyCode })
    view.webContents.sendInputEvent({ type: 'keyUp', keyCode })
  })
  ipcMain.on('quit', () => app.quit())
  ipcMain.handle('edge:get', async () => (await findEdge()) || '')
  ipcMain.handle('edge:choose', async () => (await chooseEdge()) || '')
  require('./games')({ ipcMain, app, dialog, shell, getWin: () => (alive() ? win : null), onLaunch: () => ds4.ensureRunning() })
  // A tela pergunta por avisos (arquivo corrompido, falha ao salvar) ao abrir
  ipcMain.handle('store:warnings', () => takeWarnings())
  ipcMain.handle('settings:get', () => ({ closeDs4OnMenu: closeOnMenu() }))
  ipcMain.handle('settings:set', (_e, key, val) => { if (key === 'closeDs4OnMenu') writeSettings({ closeDs4OnMenu: !!val }); return true })
  ipcMain.handle('launch', async (_e, name) => {
    if (BROWSERS[name]) return launchBrowser(name)
    const exe = APPS[name]
    if (!exe) return 'Programa desconhecido.'
    if (!fs.existsSync(exe)) return 'Não achei o arquivo: ' + exe
    return (await shell.openPath(exe)) || '' // vazio = abriu
  })

  // Atalhos globais: no DS4Windows, mapeie o botão PS para uma dessas teclas
  for (const key of ['F24', 'CommandOrControl+Alt+Home']) {
    try { globalShortcut.register(key, showMenu) } catch {}
  }
  // Fechar o que está na frente e voltar ao menu
  for (const key of ['F23', 'CommandOrControl+Alt+End']) {
    try { globalShortcut.register(key, closeCurrent) } catch {}
  }
  startPs() // aquece o PowerShell para o atalho responder rápido
})

app.on('will-quit', () => { globalShortcut.unregisterAll(); try { ps && ps.kill() } catch {} })
app.on('window-all-closed', () => app.quit())
