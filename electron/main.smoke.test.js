// Carrega o main.js de verdade com um Electron falso. Pega erros que só apareceriam ao
// abrir o app: variável usada antes de existir, serviço que faltou ligar, canal sem handler.
import { describe, it, expect } from 'vitest'
import { createRequire } from 'node:module'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const require = createRequire(import.meta.url)
const C = require('../shared/channels')

const menuCalls = []
const appEvents = []

function fakeElectron(dir) {
  const handlers = new Map()
  const noop = () => {}
  const electron = {
    app: {
      getPath: () => dir, whenReady: () => new Promise(noop), on: (ev) => appEvents.push(ev), quit: noop, isPackaged: false,
      getAppPath: () => dir, requestSingleInstanceLock: () => true, getAppMetrics: () => [], getLoginItemSettings: () => ({ openAtLogin: false }), setLoginItemSettings: noop,
    },
    ipcMain: { on: (ch, fn) => handlers.set(ch, fn), handle: (ch, fn) => handlers.set(ch, fn) },
    components: { whenReady: async () => {}, status: () => ({}) },
    dialog: { showOpenDialog: async () => ({ canceled: true, filePaths: [] }), showErrorBox: noop },
    shell: { openPath: async () => '', openExternal: async () => {} },
    globalShortcut: { register: noop, unregisterAll: noop },
    safeStorage: { isEncryptionAvailable: () => false },
    clipboard: { readText: () => ' abc ' },
    Menu: { setApplicationMenu: (m) => { menuCalls.push(m) } },
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

  // Regressão: o truque de foco aperta Alt, e o Alt mostrava o menu File/Edit/View
  it('não tem barra de menu (o Alt do truque de foco não mostra File/Edit/View)', () => {
    expect(menuCalls).toEqual([null])
  })

  it('abre uma vez só (segundo Laaazy só traz o primeiro para a frente)', () => {
    expect(appEvents).toContain('second-instance')
  })

  it('registra um handler para cada canal do contrato', () => {
    for (const ch of Object.values(C)) if (![C.GO_HOME, C.PS_TESTED, C.OSK_OPENED].includes(ch)) expect(handlers.has(ch), ch).toBe(true)
  })

  it('os canais de leitura respondem (todos os serviços foram ligados)', async () => {
    const call = (ch, ...a) => handlers.get(ch)({ senderFrame: { url: 'app://local/' } }, ...a)
    for (const ch of [C.SETTINGS_GET, C.STORE_WARNINGS, C.CATALOG_STATUS, C.COVERS_STATUS, C.AI_STATUS, C.POWER_LOGIN_GET, C.MYLIST_GET, C.DRM_STATUS, C.SYSTEM_USER, C.CLIPBOARD_READ, C.YT_STATUS]) {
      await expect(Promise.resolve(call(ch)), ch).resolves.toBeDefined()
    }
    expect(await call(C.AI_STATUS)).toMatchObject({ configured: false, model: 'gemini-3.8-flash', left: 50 })
    expect(await call(C.YT_STATUS)).toEqual({ configured: false, left: 90 })
  })
})
