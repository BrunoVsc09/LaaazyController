// Carrega o main.js de verdade com um Electron falso. Pega erros que só apareceriam ao
// abrir o app: variável usada antes de existir, serviço que faltou ligar, canal sem handler.
import { describe, it, expect } from 'vitest'
import { createRequire } from 'node:module'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const require = createRequire(import.meta.url)
const C = require('../shared/channels')

function fakeElectron(dir) {
  const handlers = new Map()
  const noop = () => {}
  const electron = {
    app: {
      getPath: () => dir, whenReady: () => new Promise(noop), on: noop, quit: noop, isPackaged: false,
      getAppPath: () => dir, getAppMetrics: () => [], getLoginItemSettings: () => ({ openAtLogin: false }), setLoginItemSettings: noop,
    },
    ipcMain: { on: (ch, fn) => handlers.set(ch, fn), handle: (ch, fn) => handlers.set(ch, fn) },
    components: { whenReady: async () => {}, status: () => ({}) },
    dialog: { showOpenDialog: async () => ({ canceled: true, filePaths: [] }), showErrorBox: noop },
    shell: { openPath: async () => '', openExternal: async () => {} },
    globalShortcut: { register: noop, unregisterAll: noop },
    safeStorage: { isEncryptionAvailable: () => false },
    clipboard: { readText: () => ' abc ' },
    protocol: { registerSchemesAsPrivileged: noop, handle: noop },
    net: { fetch: async () => ({}) },
    BrowserWindow: class {},
    WebContentsView: class {},
  }
  return { electron, handlers }
}

describe('main.js (fumaça)', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'laaazy-main-'))
  const { electron, handlers } = fakeElectron(dir)
  require.cache[require.resolve('electron')] = { id: 'electron', filename: 'electron', loaded: true, exports: electron }

  it('carrega sem erro (nenhum serviço usado antes de ser criado)', () => {
    expect(() => require('./main.js')).not.toThrow()
  })

  it('registra um handler para cada canal do contrato', () => {
    for (const ch of Object.values(C)) if (![C.GO_HOME, C.PS_TESTED].includes(ch)) expect(handlers.has(ch), ch).toBe(true)
  })

  it('os canais de leitura respondem (todos os serviços foram ligados)', async () => {
    const call = (ch, ...a) => handlers.get(ch)({}, ...a)
    for (const ch of [C.SETTINGS_GET, C.STORE_WARNINGS, C.CATALOG_STATUS, C.COVERS_STATUS, C.AI_STATUS, C.POWER_LOGIN_GET, C.MYLIST_GET, C.DRM_STATUS, C.SYSTEM_USER, C.CLIPBOARD_READ]) {
      await expect(Promise.resolve(call(ch)), ch).resolves.toBeDefined()
    }
    expect(await call(C.AI_STATUS)).toMatchObject({ configured: false, model: 'gemini-3.8-flash', left: 50 })
  })
})
