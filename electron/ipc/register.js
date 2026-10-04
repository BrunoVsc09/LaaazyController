// Liga cada canal IPC ao serviço certo, recusando argumentos de tipo errado.
const C = require('../../shared/channels')
const { isWebUrl } = require('../core/routing')

const PLAYER_KEYS = new Set(['Space', 'Left', 'Right'])
const isText = (v) => typeof v === 'string'

function registerIpc(ipcMain, h) {
  const on = (ch, fn) => ipcMain.on(ch, (_e, ...args) => fn(...args))
  const handle = (ch, fn) => ipcMain.handle(ch, (_e, ...args) => fn(...args))

  on(C.HOME, () => h.goHome())
  on(C.BACK, () => h.back())
  on(C.KEY, (key) => { if (PLAYER_KEYS.has(key)) h.sendKey(key) })
  on(C.QUIT, () => h.quit())

  handle(C.OPEN, (url, label) => (isWebUrl(url) ? h.launcher.open(url, isText(label) ? label : '') : 'Endereço inválido.'))
  handle(C.LAUNCH, (name) => (isText(name) ? h.launcher.launch(name) : 'Programa desconhecido.'))
  handle(C.EXE_GET, async (key) => (isText(key) && (await h.locator.find(key))) || '')
  handle(C.EXE_CHOOSE, async (key) => (isText(key) && (await h.locator.choose(key))) || '')
  handle(C.SETTINGS_GET, () => h.settings.all())
  handle(C.SETTINGS_SET, (key, value) => isText(key) && h.settings.set(key, value))
  handle(C.DS4_GET, () => h.ds4.get())
  handle(C.DS4_SET, (key, value) => (isText(key) ? h.ds4.set(key, isText(value) ? value : '') : { ok: false, msg: 'Card desconhecido.' }))
  handle(C.STORE_WARNINGS, () => h.takeWarnings())
  handle(C.GAMES_LIST, (opts) => h.library.list({ fresh: !!(opts && opts.fresh) }))
  handle(C.GAMES_LAUNCH, (id) => (isText(id) ? h.library.launch(id) : { ok: false, msg: 'Jogo inválido.' }))
  handle(C.GAMES_ADD_EXE, () => h.library.addExe())
  handle(C.GAMES_ADD_FOLDER, () => h.library.addFolder())
  handle(C.GAMES_REMOVE, (id) => (isText(id) ? h.library.remove(id) : { ok: false, msg: 'Jogo inválido.' }))
  handle(C.SYSTEM_USER, () => h.systemUser())
  handle(C.DRM_STATUS, () => h.drmStatus())
}

module.exports = { registerIpc }
