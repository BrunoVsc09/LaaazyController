import { describe, it, expect, vi } from 'vitest'
import mod from './register.js'
import C from '../../shared/channels.js'

function make() {
  const on = new Map()
  const handle = new Map()
  const ipcMain = { on: (ch, fn) => on.set(ch, fn), handle: (ch, fn) => handle.set(ch, fn) }
  const h = {
    launcher: { open: vi.fn(), launch: vi.fn(async () => '') },
    locator: { find: vi.fn(async () => 'C:\\E\\msedge.exe'), choose: vi.fn(async () => null) },
    settings: { all: vi.fn(() => ({ a: 1 })), set: vi.fn(() => true) },
    ds4: { get: vi.fn(), set: vi.fn(async () => ({ ok: true })) },
    library: { list: vi.fn(), launch: vi.fn(async () => ({ ok: true })), addExe: vi.fn(), addFolder: vi.fn(), remove: vi.fn() },
    goHome: vi.fn(), back: vi.fn(), sendKey: vi.fn(), quit: vi.fn(),
    takeWarnings: vi.fn(() => []),
    systemUser: vi.fn(() => ({ name: 'ana', initial: 'A' })),
    drmStatus: vi.fn(() => ({ installed: true })),
  }
  mod.registerIpc(ipcMain, h)
  const send = (ch, ...a) => on.get(ch)({}, ...a)
  const invoke = (ch, ...a) => handle.get(ch)({}, ...a)
  return { h, send, invoke, on, handle }
}

describe('registerIpc', () => {
  it('registra todos os canais do contrato', () => {
    const { on, handle } = make()
    const registered = new Set([...on.keys(), ...handle.keys()])
    for (const ch of Object.values(C)) {
      if (ch !== C.GO_HOME) expect(registered.has(ch), ch).toBe(true)
    }
  })
  it('open só aceita http(s)', () => {
    const { h, send } = make()
    send(C.OPEN, 'file:///C:/Windows/system32', 'X')
    expect(h.launcher.open).not.toHaveBeenCalled()
    send(C.OPEN, 'https://www.netflix.com', 'Netflix')
    expect(h.launcher.open).toHaveBeenCalledWith('https://www.netflix.com', 'Netflix')
  })
  it('key só aceita as teclas do player', () => {
    const { h, send } = make()
    send(C.KEY, 'F4')
    expect(h.sendKey).not.toHaveBeenCalled()
    send(C.KEY, 'Space')
    expect(h.sendKey).toHaveBeenCalledWith('Space')
  })
  it('argumentos de tipo errado são recusados sem chamar o serviço', async () => {
    const { h, invoke } = make()
    expect(await invoke(C.GAMES_LAUNCH, { id: 1 })).toMatchObject({ ok: false })
    expect(h.library.launch).not.toHaveBeenCalled()
    expect(await invoke(C.LAUNCH, null)).toBe('Programa desconhecido.')
    expect(await invoke(C.SETTINGS_SET, 5, true)).toBe(false)
  })
  it('exe:get devolve o caminho ou vazio', async () => {
    const { invoke, h } = make()
    expect(await invoke(C.EXE_GET, 'edge')).toBe('C:\\E\\msedge.exe')
    h.locator.find.mockResolvedValue(null)
    expect(await invoke(C.EXE_GET, 'edge')).toBe('')
  })
  it('games:list só repassa a opção fresh', async () => {
    const { invoke, h } = make()
    await invoke(C.GAMES_LIST, { fresh: 1, outra: 'x' })
    expect(h.library.list).toHaveBeenCalledWith({ fresh: true })
  })
})
