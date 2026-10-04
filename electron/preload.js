const { contextBridge, ipcRenderer } = require('electron')

// Mesmos nomes de shared/channels.js (o preload roda em sandbox e não pode importar arquivos)
contextBridge.exposeInMainWorld('lazy', {
  open: (url, label) => ipcRenderer.invoke('open', url, label),
  launch: (name) => ipcRenderer.invoke('launch', name),
  quit: () => ipcRenderer.send('quit'),
  onHome: (cb) => { ipcRenderer.removeAllListeners('go-home'); ipcRenderer.on('go-home', () => cb()) },
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    set: (key, val) => ipcRenderer.invoke('settings:set', key, val),
  },
  edge: {
    get: () => ipcRenderer.invoke('exe:get', 'edge'),
    choose: () => ipcRenderer.invoke('exe:choose', 'edge'),
  },
  ds4: {
    get: () => ipcRenderer.invoke('ds4:get'),
    set: (key, val) => ipcRenderer.invoke('ds4:set', key, val),
  },
  store: {
    warnings: () => ipcRenderer.invoke('store:warnings'),
  },
  games: {
    list: (opts) => ipcRenderer.invoke('games:list', opts),
    launch: (id) => ipcRenderer.invoke('games:launch', id),
    addExe: () => ipcRenderer.invoke('games:addExe'),
    addFolder: () => ipcRenderer.invoke('games:addFolder'),
    remove: (id) => ipcRenderer.invoke('games:remove', id),
  },
})
