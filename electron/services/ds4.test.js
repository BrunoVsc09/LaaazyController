import { describe, it, expect, vi } from 'vitest'
import mod from './ds4.js'

const { createDs4 } = mod

function make({ exe = 'C:/DS4/DS4Windows.exe', running = true, profiles = ['Brunera', 'PC', 'TV'], query = (n) => n, saved = {} } = {}) {
  let cfg = { ...saved }
  const state = { running, current: '' }
  const cli = {
    listProfiles: vi.fn(async () => ({ dir: 'C:/DS4/Profiles', profiles })),
    isRunning: vi.fn(async () => state.running),
    start: vi.fn(async () => { state.running = true; return '' }),
    loadProfile: vi.fn(async (_exe, name) => { state.current = name; return '' }),
    queryProfile: vi.fn(async () => (query ? query(state.current) : null)),
    shutdown: vi.fn(async () => { state.running = false }),
    kill: vi.fn(async () => { state.running = false }),
    cmdName: () => 'DS4WindowsCmd.exe',
  }
  const ds4 = createDs4({
    cli, getExe: async () => exe, sleep: async () => {},
    readCfg: async () => cfg, writeCfg: vi.fn(async (c) => { cfg = c; return true }),
  })
  return { ds4, cli, state, cfg: () => cfg }
}

describe('ds4.apply', () => {
  it('sem perfil não faz nada', async () => {
    const { ds4, cli } = make()
    expect(await ds4.apply('')).toEqual({ ok: true, msg: 'Sem troca de perfil.' })
    expect(cli.loadProfile).not.toHaveBeenCalled()
  })
  it('DS4Windows não encontrado', async () => {
    expect((await make({ exe: null }).ds4.apply('PC')).msg).toMatch(/Não achei o DS4Windows/)
  })
  it('perfil inexistente', async () => {
    expect(await make().ds4.apply('X')).toEqual({ ok: false, msg: 'Perfil "X" não encontrado na pasta de perfis.' })
  })
  it('abre o DS4Windows se estiver fechado e confirma o perfil', async () => {
    const { ds4, cli } = make({ running: false })
    expect(await ds4.apply('PC')).toEqual({ ok: true, msg: 'Perfil "PC" ativo no DS4Windows.' })
    expect(cli.start).toHaveBeenCalled()
    expect(cli.loadProfile).toHaveBeenCalledWith('C:/DS4/DS4Windows.exe', 'PC')
  })
  it('sem como confirmar (sem DS4WindowsCmd) avisa', async () => {
    expect((await make({ query: null }).ds4.apply('PC')).msg).toMatch(/não consegui confirmar/)
  })
  it('DS4Windows respondeu outro perfil', async () => {
    const r = await make({ query: () => 'Outro' }).ds4.apply('PC')
    expect(r.ok).toBe(false)
    expect(r.msg).toMatch(/respondeu "Outro"/)
  })
  it('applyFor usa o perfil configurado para o card', async () => {
    const { ds4, cli } = make({ saved: { Netflix: 'TV' } })
    await ds4.applyFor('Netflix')
    expect(cli.loadProfile).toHaveBeenCalledWith(expect.anything(), 'TV')
    await ds4.applyFor('menu')
    expect(cli.loadProfile).toHaveBeenLastCalledWith(expect.anything(), 'Brunera')
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
    expect(await make().ds4.get()).toMatchObject({ profiles: ['Brunera', 'PC', 'TV'], dir: 'C:/DS4/Profiles', config: { menu: 'Brunera' }, cmd: 'DS4WindowsCmd.exe' })
  })
  it('get sem DS4Windows devolve lista vazia', async () => {
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
  it('shutdown com o DS4Windows fechado não faz nada', async () => {
    const { ds4, cli } = make({ running: false })
    await ds4.shutdown()
    expect(cli.shutdown).not.toHaveBeenCalled()
  })
})
