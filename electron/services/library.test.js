import { describe, it, expect, vi } from 'vitest'
import mod from './library.js'

const steamGame = { id: 'steam:1', name: 'Portal', platform: 'Steam', launch: { type: 'url', value: 'steam://rungameid/1' } }

function make({ custom = [], files = [], scanned = [], spawnError = '', chosenExe = null, chosenDir = null, writeOk = true } = {}) {
  let list = [...custom]
  let t = 0
  const deps = {
    sources: [vi.fn(async () => [steamGame])],
    readCustom: async () => list,
    writeCustom: vi.fn(async (l) => { if (writeOk) list = l; return writeOk }),
    scanFolder: vi.fn(async () => scanned),
    chooseExe: async () => chosenExe,
    chooseDir: async () => chosenDir,
    exists: (p) => files.includes(p),
    openExternal: vi.fn(async () => {}),
    openPath: vi.fn(async () => ''),
    spawnDetached: vi.fn(async () => spawnError),
    onLaunch: vi.fn(),
    onLaunched: vi.fn(),
    now: () => t,
  }
  const lib = mod.createLibrary(deps)
  return { lib, deps, advance: (ms) => { t += ms }, custom: () => list }
}

const hades = { id: 'pc:c:\\j\\hades.exe', name: 'Hades', exe: 'C:\\J\\Hades.exe' }

describe('library.list', () => {
  it('junta as fontes com os jogos adicionados à mão', async () => {
    const { lib } = make({ custom: [hades] })
    const games = await lib.list()
    expect(games.map((g) => g.id)).toEqual([hades.id, 'steam:1'])
    expect(games[0]).toMatchObject({ platform: 'Meu PC', launch: { type: 'exe', value: 'C:\\J\\Hades.exe' } })
  })
  it('guarda o resultado por 15s; fresh ignora o cache', async () => {
    const { lib, deps, advance } = make()
    await lib.list(); await lib.list()
    expect(deps.sources[0]).toHaveBeenCalledTimes(1)
    advance(15001); await lib.list()
    expect(deps.sources[0]).toHaveBeenCalledTimes(2)
    await lib.list({ fresh: true })
    expect(deps.sources[0]).toHaveBeenCalledTimes(3)
  })
})

describe('library.launch', () => {
  it('jogo que não está na lista', async () => {
    expect(await make().lib.launch('x')).toMatchObject({ ok: false })
  })
  it('Steam abre pela URL e garante o DS4Windows', async () => {
    const { lib, deps } = make()
    expect(await lib.launch('steam:1')).toEqual({ ok: true, msg: '' })
    expect(deps.openExternal).toHaveBeenCalledWith('steam://rungameid/1')
    expect(deps.onLaunch).toHaveBeenCalledWith('steam:1') // para aplicar o perfil do controle do jogo
  })
  it('recusa URL que não é da Steam nem da Epic', async () => {
    const { lib, deps } = make()
    deps.sources[0].mockResolvedValue([{ ...steamGame, launch: { type: 'url', value: 'https://evil' } }])
    expect(await lib.launch('steam:1')).toMatchObject({ ok: false })
    expect(deps.openExternal).not.toHaveBeenCalled()
  })
  it('.exe abre com spawn', async () => {
    const { lib, deps } = make({ custom: [hades], files: [hades.exe] })
    expect(await lib.launch(hades.id)).toEqual({ ok: true, msg: '' })
    expect(deps.spawnDetached).toHaveBeenCalledWith(hades.exe)
  })
  it('.exe apagado avisa', async () => {
    const { lib } = make({ custom: [hades] })
    expect((await lib.launch(hades.id)).msg).toMatch(/não existe mais/)
  })
  it('erro do spawn vira mensagem', async () => {
    const { lib } = make({ custom: [hades], files: [hades.exe], spawnError: 'EACCES' })
    expect(await lib.launch(hades.id)).toEqual({ ok: false, msg: 'Não consegui abrir "Hades": EACCES' })
  })
  // B1: atalhos .lnk eram aceitos ao adicionar, mas spawn não executa atalhos
  it('B1: atalho .lnk abre pelo Windows (openPath), não por spawn', async () => {
    const lnk = { id: 'pc:c:\\j\\hades.lnk', name: 'Hades', exe: 'C:\\J\\Hades.lnk' }
    const { lib, deps } = make({ custom: [lnk], files: [lnk.exe] })
    expect(await lib.launch(lnk.id)).toEqual({ ok: true, msg: '' })
    expect(deps.openPath).toHaveBeenCalledWith(lnk.exe)
    expect(deps.spawnDetached).not.toHaveBeenCalled()
  })
  it('B1: erro do openPath vira mensagem', async () => {
    const lnk = { id: 'pc:c:\\j\\x.lnk', name: 'X', exe: 'C:\\J\\X.lnk' }
    const { lib, deps } = make({ custom: [lnk], files: [lnk.exe] })
    deps.openPath.mockResolvedValue('Atalho quebrado')
    expect(await lib.launch(lnk.id)).toEqual({ ok: false, msg: 'Não consegui abrir "X": Atalho quebrado' })
  })
})

describe('library: jogos recentes', () => {
  it('abrir com sucesso registra o jogo como recente', async () => {
    const { lib, deps } = make()
    await lib.launch('steam:1')
    expect(deps.onLaunched).toHaveBeenCalledWith('steam:1')
  })
  it('falha ao abrir não registra', async () => {
    const { lib, deps } = make({ custom: [hades], files: [hades.exe], spawnError: 'EACCES' })
    await lib.launch(hades.id)
    expect(deps.onLaunched).not.toHaveBeenCalled()
  })
})

describe('library: adicionar e remover', () => {
  it('addExe adiciona e não duplica', async () => {
    const { lib, custom } = make({ chosenExe: 'C:\\J\\Hades.exe' })
    expect(await lib.addExe()).toEqual({ ok: true, added: 1, msg: '' })
    expect(await lib.addExe()).toEqual({ ok: true, added: 0, msg: 'Esse jogo já estava na lista.' })
    expect(custom()).toEqual([hades])
  })
  it('addExe cancelado não faz nada', async () => {
    expect(await make().lib.addExe()).toEqual({ ok: true, added: 0, msg: '' })
  })
  it('addFolder conta quantos entraram', async () => {
    const { lib } = make({ chosenDir: 'C:\\J', scanned: [{ name: 'A', exe: 'C:\\J\\A\\a.exe' }, { name: 'B', exe: 'C:\\J\\B\\b.exe' }] })
    expect(await lib.addFolder()).toEqual({ ok: true, added: 2, msg: '2 jogo(s) adicionado(s).' })
  })
  it('addFolder sem jogos avisa', async () => {
    expect((await make({ chosenDir: 'C:\\J' }).lib.addFolder()).msg).toBe('Não achei nenhum jogo nessa pasta.')
  })
  it('falha ao salvar vira mensagem', async () => {
    const { lib } = make({ chosenExe: 'C:\\J\\Hades.exe', writeOk: false })
    expect(await lib.addExe()).toEqual({ ok: false, added: 0, msg: 'Não consegui salvar a lista de jogos.' })
  })
  it('remove tira da lista e invalida o cache', async () => {
    const { lib, custom, deps } = make({ custom: [hades] })
    await lib.list()
    expect(await lib.remove(hades.id)).toEqual({ ok: true, msg: '' })
    expect(custom()).toEqual([])
    await lib.list()
    expect(deps.sources[0]).toHaveBeenCalledTimes(2)
  })
})
