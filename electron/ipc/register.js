// Liga cada canal IPC ao serviço certo, recusando argumentos de tipo errado.
const C = require('../../shared/channels')
const { isWebUrl } = require('../core/routing')
const { trustedSender } = require('../core/security')
const { validEdit } = require('../core/typing')

const PLAYER_KEYS = new Set(['Space', 'Left', 'Right'])
const VOLUME_ACTIONS = new Set(['up', 'down', 'mute'])
const isText = (v) => typeof v === 'string'
const str = (v) => (isText(v) ? v : '')
const isPlain = (v) => !!v && typeof v === 'object' && !Array.isArray(v)
// Ação de um botão no editor de perfis: null (nada), { tecla: texto } ou { clique: texto }
const isPadAction = (a) => a === null || (!!a && typeof a === 'object' && Object.keys(a).length === 1 &&
  (isText(a.tecla) || isText(a.clique)))
// Edição do teclado por cima: só os campos conhecidos, e só se forem válidos
const EDIT_KEYS = ['move', 'back', 'text', 'enter']
function toEdit(e) {
  if (!e || typeof e !== 'object') return null
  const out = {}
  for (const k of EDIT_KEYS) if (e[k] !== undefined) out[k] = e[k]
  return validEdit(out) ? out : null
}

function registerIpc(ipcMain, h) {
  // Só a tela do app (e, para os comandos do controle, os sites de streaming) são atendidos
  const from = (e, ch) => trustedSender(e && e.senderFrame && e.senderFrame.url, ch)
  const on = (ch, fn) => ipcMain.on(ch, (e, ...args) => { if (from(e, ch)) fn(...args) })
  const handle = (ch, fn) => ipcMain.handle(ch, (e, ...args) => (from(e, ch) ? fn(...args) : undefined))

  on(C.HOME, () => h.goHome())
  on(C.BACK, () => h.back())
  on(C.KEY, (key) => { if (PLAYER_KEYS.has(key)) h.sendKey(key) })
  on(C.QUIT, () => h.quit())
  on(C.VOLUME, (action) => { if (VOLUME_ACTIONS.has(action)) h.volume.step(action) })

  handle(C.OPEN, (url, label) => (isWebUrl(url) ? h.launcher.open(url, isText(label) ? label : '') : 'Endereço inválido.'))
  handle(C.LAUNCH, (name) => (isText(name) ? h.launcher.launch(name) : 'Programa desconhecido.'))
  handle(C.EXE_GET, async (key) => (isText(key) && (await h.locator.find(key))) || '')
  handle(C.EXE_CHOOSE, async (key) => (isText(key) && (await h.locator.choose(key))) || '')
  handle(C.SETTINGS_GET, () => h.settings.all())
  handle(C.SETTINGS_SET, (key, value) => isText(key) && h.settings.set(key, value))
  handle(C.DS4_GET, () => h.ds4.get())
  handle(C.DS4_SET, (key, value) => (isText(key) ? h.ds4.set(key, isText(value) ? value : '') : { ok: false, msg: 'Card desconhecido.' }))
  handle(C.DS4_PROFILE, (name) => (isText(name) ? h.ds4.profile(name) : { ok: false, msg: 'Perfil inválido.' }))
  handle(C.DS4_SET_BUTTON, (name, id, action) => (isText(name) && isText(id) && isPadAction(action)
    ? h.ds4.setButton(name, id, action === null ? null : { ...action })
    : { ok: false, msg: 'Mudança inválida.' }))
  handle(C.STORE_WARNINGS, () => h.takeWarnings())
  handle(C.GAMES_LIST, (opts) => h.library.list({ fresh: !!(opts && opts.fresh) }))
  handle(C.GAMES_LAUNCH, (id) => (isText(id) ? h.library.launch(id) : { ok: false, msg: 'Jogo inválido.' }))
  handle(C.GAMES_ADD_EXE, () => h.library.addExe())
  handle(C.GAMES_ADD_FOLDER, () => h.library.addFolder())
  handle(C.GAMES_ADD_EXE_PATH, (p) => (isText(p) ? h.library.addExePath(p) : { ok: false, added: 0, msg: 'Arquivo inválido.' }))
  handle(C.GAMES_ADD_FOLDER_PATH, (p) => (isText(p) ? h.library.addFolderPath(p) : { ok: false, added: 0, msg: 'Pasta inválida.' }))
  handle(C.FS_LIST, (dir, mode) => (isText(dir) && ['file', 'dir', 'image'].includes(mode) ? h.browse.list(dir, mode) : { ok: false, entries: [], msg: 'Pasta inválida.' }))
  handle(C.GAMES_REMOVE, (id) => (isText(id) ? h.library.remove(id) : { ok: false, msg: 'Jogo inválido.' }))
  handle(C.USER_GET, () => h.user.get())
  handle(C.USER_SET, (change) => (isPlain(change) ? h.user.set({ ...change }) : { ok: false, msg: 'Mudança inválida.' }))
  handle(C.USER_SET_PHOTO, (file) => (isText(file) ? h.user.setPhoto(file) : { ok: false, msg: 'Foto inválida.' }))
  handle(C.USER_CHOOSE_PHOTO, () => h.user.choosePhoto())
  handle(C.USER_FINISH, () => h.user.finish())
  handle(C.DRM_STATUS, () => h.drmStatus())
  handle(C.CATALOG_STATUS, () => h.catalog.status())
  handle(C.CATALOG_SET_KEY, (key) => (isText(key) ? h.catalog.setKey(key) : { ok: false, msg: 'Chave inválida.' }))
  handle(C.CATALOG_CLEAR_KEY, () => h.catalog.clearKey())
  handle(C.CATALOG_HOME, (opts) => h.catalog.home({ fresh: !!(opts && opts.fresh) }))
  handle(C.CATALOG_TRAILER, (id, hint) => (isText(id)
    ? h.catalog.trailer(id, hint ? { title: str(hint.title).slice(0, 200), year: str(hint.year).slice(0, 4) } : undefined)
    : []))
  handle(C.YT_STATUS, () => h.ytTrailers.status())
  handle(C.YT_SET_KEY, (key) => (isText(key) ? h.ytTrailers.setKey(key) : { ok: false, msg: 'Chave inválida.' }))
  handle(C.YT_CLEAR_KEY, () => h.ytTrailers.clearKey())
  handle(C.CATALOG_SEARCH, (q) => (isText(q) ? h.catalog.search(q) : { ok: false, items: [], msg: 'Busca inválida.' }))
  handle(C.CATALOG_EXPLORE, (sel) => (sel && typeof sel === 'object' && !Array.isArray(sel) ? h.catalog.explore(sel) : { ok: false, items: [], msg: 'Escolha inválida.' }))
  handle(C.OSK_EDIT, (e) => { const edit = toEdit(e); return edit ? h.textEntry.edit(edit) : false })
  handle(C.OSK_CLOSE, () => h.textEntry.close())
  handle(C.CLIPBOARD_READ, () => h.readClipboard())
  handle(C.PS_TEST_START, () => h.psButton.startTest())
  handle(C.AI_STATUS, () => h.assistant.status())
  handle(C.AI_SET_KEY, (key) => (isText(key) ? h.assistant.setKey(key) : { ok: false, msg: 'Chave inválida.' }))
  handle(C.AI_CLEAR_KEY, () => h.assistant.clearKey())
  handle(C.DESKTOP_ENTER, () => h.desktop.enter())
  handle(C.AI_SIMILAR, (t) => (t && isText(t.id) && isText(t.title)
    ? h.assistant.similarMood({ id: t.id, title: t.title, kind: str(t.kind), year: str(t.year), overview: str(t.overview) })
    : { ok: false, items: [], msg: 'Título inválido.' }))
  handle(C.COVERS_STATUS, () => h.covers.status())
  handle(C.COVERS_SET_KEY, (key) => (isText(key) ? h.covers.setKey(key) : { ok: false, msg: 'Chave inválida.' }))
  handle(C.COVERS_CLEAR_KEY, () => h.covers.clearKey())
  handle(C.POWER_RUN, (action, confirmed) => (isText(action) ? h.power.run(action, confirmed === true) : { ok: false, msg: 'Ação desconhecida.' }))
  handle(C.POWER_LOGIN_GET, () => h.power.openAtLogin())
  handle(C.POWER_LOGIN_SET, (on) => h.power.setOpenAtLogin(!!on))
  handle(C.CATALOG_EPISODES, async () => h.catalog.episodes(await h.myList.get()))
  handle(C.GAMES_RECENT, () => h.recentGames())
  handle(C.MYLIST_GET, () => h.myList.get())
  handle(C.MYLIST_TOGGLE, (item) => (item && typeof item === 'object' ? h.myList.toggle(item) : { ok: false, msg: 'Título inválido.' }))
  handle(C.CATALOG_WHERE, async (id) => (isText(id) ? h.catalog.where(id) : []))
}

module.exports = { registerIpc }
