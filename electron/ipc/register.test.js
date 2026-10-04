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
    catalog: {
      status: vi.fn(() => ({ configured: true })),
      setKey: vi.fn(async () => ({ ok: true, msg: '' })),
      clearKey: vi.fn(async () => ({ ok: true, msg: '' })),
      home: vi.fn(async () => ({ ok: true })),
      trailer: vi.fn(async () => 'yt1'),
      search: vi.fn(async () => ({ ok: true, items: [] })),
      where: vi.fn(async () => []),
      episodes: vi.fn(async () => []),
    },
    myList: { get: vi.fn(async () => []), toggle: vi.fn(async () => ({ ok: true, added: true })) },
    recentGames: vi.fn(async () => []),
    volume: { step: vi.fn(() => true) },
    covers: { status: vi.fn(() => ({ configured: false })), setKey: vi.fn(async () => ({ ok: true })), clearKey: vi.fn(async () => ({ ok: true })) },
    power: { run: vi.fn(async () => ({ ok: true })), openAtLogin: vi.fn(() => false), setOpenAtLogin: vi.fn() },
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
  it('open só aceita http(s) e devolve o aviso do launcher', async () => {
    const { h, invoke } = make()
    expect(await invoke(C.OPEN, 'file:///C:/Windows/system32', 'X')).toBe('Endereço inválido.')
    expect(h.launcher.open).not.toHaveBeenCalled()
    h.launcher.open.mockResolvedValue('Widevine não instalado.')
    expect(await invoke(C.OPEN, 'https://www.netflix.com', 'Netflix')).toBe('Widevine não instalado.')
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
  it('energia: confirmação só conta se for exatamente true', async () => {
    const { invoke, h } = make()
    await invoke(C.POWER_RUN, 'shutdown', 'sim')
    expect(h.power.run).toHaveBeenLastCalledWith('shutdown', false)
    await invoke(C.POWER_RUN, 'shutdown', true)
    expect(h.power.run).toHaveBeenLastCalledWith('shutdown', true)
    expect(await invoke(C.POWER_RUN, 5)).toMatchObject({ ok: false })
    await invoke(C.POWER_LOGIN_SET, 1)
    expect(h.power.setOpenAtLogin).toHaveBeenCalledWith(true)
  })
  it('novos episódios usa a Minha lista', async () => {
    const { invoke, h } = make()
    h.myList.get.mockResolvedValue([{ id: 'tv:1' }])
    await invoke(C.CATALOG_EPISODES)
    expect(h.catalog.episodes).toHaveBeenCalledWith([{ id: 'tv:1' }])
  })
  it('volume: só up, down e mute', () => {
    const { send, h } = make()
    send(C.VOLUME, 'explodir')
    expect(h.volume.step).not.toHaveBeenCalled()
    send(C.VOLUME, 'up')
    expect(h.volume.step).toHaveBeenCalledWith('up')
  })
  it('capas: chave precisa ser texto', async () => {
    const { invoke, h } = make()
    expect(await invoke(C.COVERS_SET_KEY, {})).toMatchObject({ ok: false })
    expect(h.covers.setKey).not.toHaveBeenCalled()
  })
  it('Minha lista: toggle só com objeto', async () => {
    const { invoke, h } = make()
    expect(await invoke(C.MYLIST_TOGGLE, 'tv:1')).toMatchObject({ ok: false })
    expect(h.myList.toggle).not.toHaveBeenCalled()
    await invoke(C.MYLIST_TOGGLE, { id: 'tv:1' })
    expect(h.myList.toggle).toHaveBeenCalled()
  })
  it('busca e where: só texto', async () => {
    const { invoke, h } = make()
    expect(await invoke(C.CATALOG_SEARCH, 5)).toMatchObject({ ok: false, items: [] })
    expect(await invoke(C.CATALOG_WHERE, null)).toEqual([])
    await invoke(C.CATALOG_SEARCH, 'duna')
    expect(h.catalog.search).toHaveBeenCalledWith('duna')
  })
  it('catálogo: chave e id precisam ser texto; home só repassa fresh', async () => {
    const { invoke, h } = make()
    expect(await invoke(C.CATALOG_SET_KEY, 123)).toMatchObject({ ok: false })
    expect(h.catalog.setKey).not.toHaveBeenCalled()
    await invoke(C.CATALOG_SET_KEY, 'CHAVE')
    expect(h.catalog.setKey).toHaveBeenCalledWith('CHAVE')
    expect(await invoke(C.CATALOG_TRAILER, {})).toBeNull()
    expect(await invoke(C.CATALOG_TRAILER, 'tv:1')).toBe('yt1')
    await invoke(C.CATALOG_HOME, { fresh: 'sim', x: 1 })
    expect(h.catalog.home).toHaveBeenCalledWith({ fresh: true })
  })
  it('games:list só repassa a opção fresh', async () => {
    const { invoke, h } = make()
    await invoke(C.GAMES_LIST, { fresh: 1, outra: 'x' })
    expect(h.library.list).toHaveBeenCalledWith({ fresh: true })
  })
})
