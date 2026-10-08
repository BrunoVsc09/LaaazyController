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
    library: { list: vi.fn(), launch: vi.fn(async () => ({ ok: true })), addExe: vi.fn(), addFolder: vi.fn(), remove: vi.fn(), addExePath: vi.fn(async () => ({ ok: true })), addFolderPath: vi.fn(async () => ({ ok: true })) },
    browse: { list: vi.fn(async () => ({ ok: true, entries: [] })), places: vi.fn(() => ({ places: [], drives: [] })) },
    goHome: vi.fn(), back: vi.fn(), sendKey: vi.fn(), quit: vi.fn(),
    takeWarnings: vi.fn(() => []),
    systemUser: vi.fn(() => ({ name: 'ana', initial: 'A' })),
    drmStatus: vi.fn(() => ({ installed: true })),
    catalog: {
      status: vi.fn(() => ({ configured: true })),
      setKey: vi.fn(async () => ({ ok: true, msg: '' })),
      clearKey: vi.fn(async () => ({ ok: true, msg: '' })),
      home: vi.fn(async () => ({ ok: true })),
      trailer: vi.fn(async () => [{ key: 'yt1', lang: 'pt' }]),
      search: vi.fn(async () => ({ ok: true, items: [] })),
      where: vi.fn(async () => []),
      episodes: vi.fn(async () => []),
      explore: vi.fn(async () => ({ ok: true, items: [] })),
    },
    myList: { get: vi.fn(async () => []), toggle: vi.fn(async () => ({ ok: true, added: true })) },
    recentGames: vi.fn(async () => []),
    textEntry: { edit: vi.fn(async () => true), close: vi.fn() },
    readClipboard: vi.fn(() => 'abc'),
    psButton: { startTest: vi.fn(() => true) },
    desktop: { enter: vi.fn(async () => ({ ok: true, msg: '' })) },
    ytTrailers: { status: vi.fn(async () => ({ configured: false, left: 90 })), setKey: vi.fn(async () => ({ ok: true })), clearKey: vi.fn(async () => ({ ok: true })) },
    assistant: { status: vi.fn(async () => ({})), setKey: vi.fn(async () => ({ ok: true })), clearKey: vi.fn(async () => ({ ok: true })), similarMood: vi.fn(async () => ({ ok: true, items: [] })) },
    volume: { step: vi.fn(() => true) },
    covers: { status: vi.fn(() => ({ configured: false })), setKey: vi.fn(async () => ({ ok: true })), clearKey: vi.fn(async () => ({ ok: true })) },
    power: { run: vi.fn(async () => ({ ok: true })), openAtLogin: vi.fn(() => false), setOpenAtLogin: vi.fn() },
  }
  mod.registerIpc(ipcMain, h)
  const APP_EVENT = { senderFrame: { url: 'app://local/' } }
  const send = (ch, ...a) => on.get(ch)(APP_EVENT, ...a)
  const invoke = (ch, ...a) => handle.get(ch)(APP_EVENT, ...a)
  const from = (url) => ({ senderFrame: { url } })
  return { h, send, invoke, on, handle, from }
}

describe('registerIpc', () => {
  it('registra todos os canais do contrato', () => {
    const { on, handle } = make()
    const registered = new Set([...on.keys(), ...handle.keys()])
    for (const ch of Object.values(C)) {
      if (![C.GO_HOME, C.PS_TESTED, C.OSK_OPENED].includes(ch)) expect(registered.has(ch), ch).toBe(true)
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
  it('explorar: só aceita objeto de escolhas', async () => {
    const { invoke, h } = make()
    expect(await invoke(C.CATALOG_EXPLORE, 'terror')).toMatchObject({ ok: false, items: [] })
    expect(h.catalog.explore).not.toHaveBeenCalled()
    await invoke(C.CATALOG_EXPLORE, { genre: 'terror' })
    expect(h.catalog.explore).toHaveBeenCalledWith({ genre: 'terror' })
  })
  it('navegador de pastas: caminhos só como texto; modo só file ou dir', async () => {
    const { invoke, h } = make()
    expect(await invoke(C.FS_LIST, 5, 'file')).toMatchObject({ ok: false })
    expect(await invoke(C.FS_LIST, 'C:\\', 'tudo')).toMatchObject({ ok: false })
    expect(h.browse.list).not.toHaveBeenCalled()
    await invoke(C.FS_LIST, 'C:\\', 'dir')
    expect(h.browse.list).toHaveBeenCalledWith('C:\\', 'dir')
    expect(await invoke(C.GAMES_ADD_EXE_PATH, {})).toMatchObject({ ok: false })
    expect(h.library.addExePath).not.toHaveBeenCalled()
  })
  it('IA: chave só como texto', async () => {
    const { invoke, h } = make()
    expect(await invoke(C.AI_SET_KEY, 5)).toMatchObject({ ok: false })
    expect(h.assistant.setKey).not.toHaveBeenCalled()
  })
  it('IA "Parecido com este": só objeto com id e título em texto; repassa só os campos conhecidos', async () => {
    const { invoke, h } = make()
    expect(await invoke(C.AI_SIMILAR, 'tv:1')).toMatchObject({ ok: false, items: [] })
    expect(await invoke(C.AI_SIMILAR, { id: 1, title: 'Dark' })).toMatchObject({ ok: false, items: [] })
    expect(h.assistant.similarMood).not.toHaveBeenCalled()
    await invoke(C.AI_SIMILAR, { id: 'tv:1', title: 'Dark', kind: 'Série', year: '2017', overview: 'x', poster: 'p', extra: { a: 1 } })
    expect(h.assistant.similarMood).toHaveBeenCalledWith({ id: 'tv:1', title: 'Dark', kind: 'Série', year: '2017', overview: 'x' })
  })
  it('Área de trabalho: canal sem argumentos', async () => {
    const { invoke, h } = make()
    expect(await invoke(C.DESKTOP_ENTER, 'qualquer')).toEqual({ ok: true, msg: '' })
    expect(h.desktop.enter).toHaveBeenCalledWith()
  })
  it('blindagem: canal pedido por origem estranha é recusado sem chamar o serviço', async () => {
    const { h, handle, on, from } = make()
    expect(await handle.get(C.GAMES_LAUNCH)(from('https://evil.com/'), 'steam:1')).toBeUndefined()
    expect(await handle.get(C.AI_SET_KEY)(from('https://www.netflix.com/'), 'k')).toBeUndefined()
    expect(await handle.get(C.SETTINGS_GET)({}, 'x')).toBeUndefined() // sem frame
    expect(h.library.launch).not.toHaveBeenCalled()
    expect(h.assistant.setKey).not.toHaveBeenCalled()
    on.get(C.VOLUME)(from('https://www.netflix.com/'), 'up') // streaming pode usar o volume
    expect(h.volume.step).toHaveBeenCalledWith('up')
    on.get(C.QUIT)(from('https://www.netflix.com/'))
    expect(h.quit).not.toHaveBeenCalled()
  })
  it('"Pedir à IA" saiu: o canal ai:ask não existe mais', () => {
    expect(C.AI_ASK).toBeUndefined()
    expect([...make().handle.keys()]).not.toContain('ai:ask')
  })
  it('YouTube: chave só como texto', async () => {
    const { invoke, h } = make()
    expect(await invoke(C.YT_SET_KEY, 5)).toMatchObject({ ok: false })
    expect(h.ytTrailers.setKey).not.toHaveBeenCalled()
    await invoke(C.YT_SET_KEY, 'AIza')
    expect(h.ytTrailers.setKey).toHaveBeenCalledWith('AIza')
    expect(await invoke(C.YT_STATUS)).toEqual({ configured: false, left: 90 })
  })
  it('volume: só up, down e mute', () => {
    const { send, h } = make()
    send(C.VOLUME, 'explodir')
    expect(h.volume.step).not.toHaveBeenCalled()
    send(C.VOLUME, 'up')
    expect(h.volume.step).toHaveBeenCalledWith('up')
  })
  it('teclado por cima (tempo real): apagar é número inteiro e o texto é texto; fechar não leva nada', async () => {
    const { invoke, h } = make()
    expect(await invoke(C.OSK_EDIT, '1', 'a')).toBe(false)
    expect(await invoke(C.OSK_EDIT, 0, { evil: 1 })).toBe(false)
    expect(h.textEntry.edit).not.toHaveBeenCalled()
    await invoke(C.OSK_EDIT, 1, 'abc')
    expect(h.textEntry.edit).toHaveBeenCalledWith(1, 'abc')
    await invoke(C.OSK_CLOSE, 'qualquer')
    expect(h.textEntry.close).toHaveBeenCalledWith()
    expect(C.OSK_SUBMIT).toBeUndefined() // não existe mais o "manda tudo no Pronto"
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
    expect(await invoke(C.CATALOG_TRAILER, {})).toEqual([])
    expect(await invoke(C.CATALOG_TRAILER, 'tv:1')).toEqual([{ key: 'yt1', lang: 'pt' }])
    // título e ano para achar o trailer dublado: só texto, cortado em 200 letras
    await invoke(C.CATALOG_TRAILER, 'tv:2', { title: 'D'.repeat(300), year: 2017, x: 1 })
    expect(h.catalog.trailer).toHaveBeenLastCalledWith('tv:2', { title: 'D'.repeat(200), year: '' })
    await invoke(C.CATALOG_HOME, { fresh: 'sim', x: 1 })
    expect(h.catalog.home).toHaveBeenCalledWith({ fresh: true })
  })
  it('games:list só repassa a opção fresh', async () => {
    const { invoke, h } = make()
    await invoke(C.GAMES_LIST, { fresh: 1, outra: 'x' })
    expect(h.library.list).toHaveBeenCalledWith({ fresh: true })
  })
})
