import { describe, it, expect, vi } from 'vitest'
import mod from './ds4.js'

const { createDs4 } = mod

function make({ exe = 'C:/P/LaaazyPad.exe', running = true, profiles = ['Jogos', 'PC', 'TV'], query = (n) => n, saved = {}, readyDelayMs, dir = 'C:/P/Profiles' } = {}) {
  let cfg = { ...saved }
  const state = { running, current: '' }
  const cli = {
    listProfiles: vi.fn(async () => ({ dir, profiles })),
    isRunning: vi.fn(async () => state.running),
    start: vi.fn(async () => { state.running = true; return '' }),
    loadProfile: vi.fn(async (_exe, name) => { state.current = name; return '' }),
    queryProfile: vi.fn(async () => (query ? query(state.current) : null)),
    shutdown: vi.fn(async () => { state.running = false }),
    kill: vi.fn(async () => { state.running = false }),
    cmdName: () => 'LaaazyPadCmd.exe',
  }
  const sleep = vi.fn(async () => {})
  const openPath = vi.fn(async () => '')
  const ds4 = createDs4({
    cli, getExe: async () => exe, sleep, readyDelayMs, openPath,
    readCfg: async () => cfg, writeCfg: vi.fn(async (c) => { cfg = c; return true }),
  })
  return { ds4, cli, state, sleep, openPath, cfg: () => cfg }
}

describe('ds4.apply', () => {
  it('sem perfil não faz nada', async () => {
    const { ds4, cli } = make()
    expect(await ds4.apply('')).toEqual({ ok: true, msg: 'Sem troca de perfil.' })
    expect(cli.loadProfile).not.toHaveBeenCalled()
  })
  it('Laaazy-pad não encontrado', async () => {
    expect((await make({ exe: null }).ds4.apply('PC')).msg).toMatch(/Não achei o Laaazy-pad/)
  })
  it('perfil inexistente', async () => {
    expect(await make().ds4.apply('X')).toEqual({ ok: false, msg: 'Perfil "X" não encontrado na pasta de perfis.' })
  })
  it('abre o Laaazy-pad se estiver fechado e confirma o perfil', async () => {
    const { ds4, cli } = make({ running: false })
    expect(await ds4.apply('PC')).toEqual({ ok: true, msg: 'Perfil "PC" ativo no Laaazy-pad.' })
    expect(cli.start).toHaveBeenCalled()
    expect(cli.loadProfile).toHaveBeenCalledWith('C:/P/LaaazyPad.exe', 'PC')
  })
  // O DS4Windows pedia 5 s depois de abrir; o Laaazy-pad aceita comandos em ~300 ms
  it('depois de abrir, espera só o tempo combinado (readyDelayMs) antes do comando', async () => {
    const { ds4, sleep, cli } = make({ running: false, readyDelayMs: 300 })
    await ds4.apply('PC')
    expect(sleep).toHaveBeenCalledWith(300)
    expect(sleep.mock.invocationCallOrder[0]).toBeLessThan(cli.loadProfile.mock.invocationCallOrder[0])
  })
  it('já aberto: não espera nada', async () => {
    const { ds4, sleep } = make({ running: true, readyDelayMs: 300 })
    await ds4.apply('PC')
    expect(sleep).not.toHaveBeenCalled()
  })
  it('erro do Laaazy-pad ao carregar: mostra a mensagem dele', async () => {
    const { ds4, cli } = make()
    cli.loadProfile.mockResolvedValueOnce('PC.json: botão L2: Tecla "Baixo" não existe.')
    expect(await ds4.apply('PC')).toEqual({ ok: false, msg: 'Erro ao trocar o perfil: PC.json: botão L2: Tecla "Baixo" não existe.' })
  })
  it('sem como confirmar (Laaazy-pad não respondeu) avisa', async () => {
    expect((await make({ query: null }).ds4.apply('PC')).msg).toMatch(/não consegui confirmar/)
  })
  it('Laaazy-pad respondeu outro perfil', async () => {
    const r = await make({ query: () => 'Outro' }).ds4.apply('PC')
    expect(r.ok).toBe(false)
    expect(r.msg).toMatch(/respondeu "Outro"/)
  })
  it('applyFor usa o perfil configurado para o card', async () => {
    const { ds4, cli } = make({ saved: { Netflix: 'TV' } })
    await ds4.applyFor('Netflix')
    expect(cli.loadProfile).toHaveBeenCalledWith(expect.anything(), 'TV')
    await ds4.applyFor('menu')
    expect(cli.loadProfile).toHaveBeenLastCalledWith(expect.anything(), 'Jogos')
  })
})

describe('ds4.applyForGame', () => {
  it('aplica o perfil do jogo ou o padrão dos jogos', async () => {
    const { ds4, cli } = make({ saved: { games: 'PC', 'game:steam:1': 'TV' } })
    await ds4.applyForGame('steam:1')
    expect(cli.loadProfile).toHaveBeenLastCalledWith(expect.anything(), 'TV')
    await ds4.applyForGame('epic:x')
    expect(cli.loadProfile).toHaveBeenLastCalledWith(expect.anything(), 'PC')
  })
  it('perfil por jogo é salvo pelo set', async () => {
    const { ds4, cfg } = make()
    expect((await ds4.set('game:steam:1', 'TV')).ok).toBe(true)
    expect(cfg()['game:steam:1']).toBe('TV')
  })
})

describe('ds4.set / get', () => {
  it('salva e já aplica', async () => {
    const { ds4, cfg } = make()
    expect((await ds4.set('Netflix', 'TV')).ok).toBe(true)
    expect(cfg().Netflix).toBe('TV')
  })
  it('B6: perfil inexistente não é salvo', async () => {
    const { ds4, cfg } = make()
    expect((await ds4.set('Netflix', 'Fantasma')).ok).toBe(false)
    expect(cfg().Netflix).toBeUndefined()
  })
  it('card desconhecido não é salvo', async () => {
    const { ds4, cfg } = make()
    expect((await ds4.set('Minecraft', 'TV')).ok).toBe(false)
    expect(cfg()).toEqual({})
  })
  it('get devolve perfis, pasta, configuração com padrões e nome do comando', async () => {
    expect(await make().ds4.get()).toMatchObject({ profiles: ['Jogos', 'PC', 'TV'], dir: 'C:/P/Profiles', config: { menu: 'Jogos' }, cmd: 'LaaazyPadCmd.exe' })
  })
  it('get sem o Laaazy-pad devolve lista vazia', async () => {
    expect(await make({ exe: null }).ds4.get()).toMatchObject({ profiles: [], dir: null })
  })
})

describe('ds4: abrir e fechar', () => {
  it('ensureRunning abre só se estiver fechado', async () => {
    const a = make({ running: true }); await a.ds4.ensureRunning(); expect(a.cli.start).not.toHaveBeenCalled()
    const b = make({ running: false }); await b.ds4.ensureRunning(); expect(b.cli.start).toHaveBeenCalled()
  })
  it('shutdown pede para fechar e força se continuar aberto', async () => {
    const { ds4, cli } = make()
    cli.shutdown.mockImplementation(async () => {}) // não fechou
    await ds4.shutdown()
    expect(cli.kill).toHaveBeenCalled()
  })
  it('shutdown com o Laaazy-pad fechado não faz nada', async () => {
    const { ds4, cli } = make({ running: false })
    await ds4.shutdown()
    expect(cli.shutdown).not.toHaveBeenCalled()
  })
})

// Tela Perfis do controle: "Abrir a pasta dos perfis" (no lugar de "Abrir o DS4Windows")
describe('ds4.openDir', () => {
  it('abre a pasta dos perfis que o próprio serviço achou', async () => {
    const { ds4, openPath } = make()
    expect(await ds4.openDir()).toEqual({ ok: true, msg: 'Pasta dos perfis aberta: C:/P/Profiles' })
    expect(openPath).toHaveBeenCalledWith('C:/P/Profiles')
  })
  it('sem o Laaazy-pad ou sem pasta de perfis: explica', async () => {
    expect((await make({ exe: null }).ds4.openDir()).msg).toMatch(/Não achei o Laaazy-pad/)
    const { ds4, openPath } = make({ dir: null })
    expect(await ds4.openDir()).toEqual({ ok: false, msg: 'Não achei a pasta dos perfis do Laaazy-pad.' })
    expect(openPath).not.toHaveBeenCalled()
  })
})
