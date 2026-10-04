// Ponte entre a tela do menu e o processo principal (window.lazy).
// Fonte: scripts/build-preloads.js gera electron/preload.js com shared/ embutido.
const { contextBridge, ipcRenderer } = require('electron')
const C = require('../shared/channels')

const invoke = (channel) => (...args) => ipcRenderer.invoke(channel, ...args)

contextBridge.exposeInMainWorld('lazy', {
  open: invoke(C.OPEN),
  launch: invoke(C.LAUNCH),
  quit: () => ipcRenderer.send(C.QUIT),
  clipboard: { read: invoke(C.CLIPBOARD_READ) },
  volume: (action) => ipcRenderer.send(C.VOLUME, action),
  ps: {
    startTest: invoke(C.PS_TEST_START),
    onTested: (cb) => { ipcRenderer.removeAllListeners(C.PS_TESTED); ipcRenderer.on(C.PS_TESTED, () => cb()) },
  },
  onHome: (cb) => { ipcRenderer.removeAllListeners(C.GO_HOME); ipcRenderer.on(C.GO_HOME, () => cb()) },
  settings: { get: invoke(C.SETTINGS_GET), set: invoke(C.SETTINGS_SET) },
  exe: { get: invoke(C.EXE_GET), choose: invoke(C.EXE_CHOOSE) },
  ds4: { get: invoke(C.DS4_GET), set: invoke(C.DS4_SET) },
  store: { warnings: invoke(C.STORE_WARNINGS) },
  games: {
    list: invoke(C.GAMES_LIST),
    launch: invoke(C.GAMES_LAUNCH),
    addExe: invoke(C.GAMES_ADD_EXE),
    addFolder: invoke(C.GAMES_ADD_FOLDER),
    recent: invoke(C.GAMES_RECENT),
    remove: invoke(C.GAMES_REMOVE),
  },
  system: { user: invoke(C.SYSTEM_USER) },
  ai: { status: invoke(C.AI_STATUS), setKey: invoke(C.AI_SET_KEY), clearKey: invoke(C.AI_CLEAR_KEY), ask: invoke(C.AI_ASK) },
  covers: { status: invoke(C.COVERS_STATUS), setKey: invoke(C.COVERS_SET_KEY), clearKey: invoke(C.COVERS_CLEAR_KEY) },
  myList: { get: invoke(C.MYLIST_GET), toggle: invoke(C.MYLIST_TOGGLE) },
  power: { run: invoke(C.POWER_RUN), openAtLogin: invoke(C.POWER_LOGIN_GET), setOpenAtLogin: invoke(C.POWER_LOGIN_SET) },
  drm: { status: invoke(C.DRM_STATUS) },
  catalog: {
    status: invoke(C.CATALOG_STATUS),
    setKey: invoke(C.CATALOG_SET_KEY),
    clearKey: invoke(C.CATALOG_CLEAR_KEY),
    home: invoke(C.CATALOG_HOME),
    trailer: invoke(C.CATALOG_TRAILER),
    search: invoke(C.CATALOG_SEARCH),
    where: invoke(C.CATALOG_WHERE),
    episodes: invoke(C.CATALOG_EPISODES),
  },
})
