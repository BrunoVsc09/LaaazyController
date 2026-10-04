// Ponte entre a tela do menu e o processo principal (window.lazy).
// Fonte: scripts/build-preloads.js gera electron/preload.js com shared/ embutido.
const { contextBridge, ipcRenderer } = require('electron')
const C = require('../shared/channels')

const invoke = (channel) => (...args) => ipcRenderer.invoke(channel, ...args)

contextBridge.exposeInMainWorld('lazy', {
  open: invoke(C.OPEN),
  launch: invoke(C.LAUNCH),
  quit: () => ipcRenderer.send(C.QUIT),
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
    remove: invoke(C.GAMES_REMOVE),
  },
  system: { user: invoke(C.SYSTEM_USER) },
  drm: { status: invoke(C.DRM_STATUS) },
  catalog: {
    status: invoke(C.CATALOG_STATUS),
    setKey: invoke(C.CATALOG_SET_KEY),
    clearKey: invoke(C.CATALOG_CLEAR_KEY),
    home: invoke(C.CATALOG_HOME),
    trailer: invoke(C.CATALOG_TRAILER),
    search: invoke(C.CATALOG_SEARCH),
    where: invoke(C.CATALOG_WHERE),
  },
})
