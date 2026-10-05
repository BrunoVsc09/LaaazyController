import { describe, it, expect, vi } from 'vitest'
import mod from './yt-trailers.js'

const DAY = 24 * 3600 * 1000
const dark = { id: 'tv:70523', title: 'Dark', year: '2017' }
const found = [{ id: { kind: 'youtube#video', videoId: 'dub11111111' }, snippet: { title: 'Dark | Trailer Dublado', channelTitle: 'Netflix Brasil' } }]

function make({ key = 'AIzaYT', results = found, usage = null, cache = {}, t = 10 * DAY } = {}) {
  let saved = key
  let stored = cache
  let used = usage
  let now = t
  const yt = { search: vi.fn(async () => { if (results instanceof Error) throw results; return results }), ping: vi.fn(async () => true) }
  const secrets = { get: () => saved, set: vi.fn((_n, v) => { saved = v; return true }), clear: vi.fn(() => { saved = '' }) }
  const s = mod.createYtTrailers({
    yt, secrets,
    readCache: async () => stored, writeCache: vi.fn(async (c) => { stored = c; return true }),
    readUsage: async () => used, writeUsage: async (u) => { used = u; return true },
    now: () => now,
  })
  return { s, yt, secrets, cache: () => stored, usage: () => used, advance: (ms) => { now += ms } }
}

describe('ytTrailers.find', () => {
  it('busca no YouTube, escolhe o dublado e guarda por título (não gasta cota de novo)', async () => {
    const { s, yt, usage } = make()
    expect(await s.find(dark)).toEqual([{ key: 'dub11111111', lang: 'pt', label: 'dublado' }])
    expect(yt.search).toHaveBeenCalledWith('AIzaYT', 'Dark 2017 trailer dublado legendado')
    await s.find(dark)
    expect(yt.search).toHaveBeenCalledTimes(1)
    expect(usage()).toEqual({ day: 10, count: 1 })
  })
  it('nada achado também fica guardado; depois de 30 dias busca de novo', async () => {
    const { s, yt, advance } = make({ results: [] })
    expect(await s.find(dark)).toEqual([])
    await s.find(dark)
    expect(yt.search).toHaveBeenCalledTimes(1)
    advance(31 * DAY)
    await s.find(dark)
    expect(yt.search).toHaveBeenCalledTimes(2)
  })
  it('sem chave, sem título ou passou de 90 buscas hoje: nem pergunta ao YouTube', async () => {
    for (const m of [make({ key: '' }), make({ usage: { day: 10, count: 90 } })]) {
      expect(await m.s.find(dark)).toEqual([])
      expect(m.yt.search).not.toHaveBeenCalled()
    }
    expect(await make().s.find({ id: 'tv:1', title: '' })).toEqual([])
  })
  it('cota do YouTube acabou: para de buscar hoje; erro de rede não fica guardado', async () => {
    const q = make({ results: Object.assign(new Error('cota'), { code: 'quota' }) })
    expect(await q.s.find(dark)).toEqual([])
    expect(q.usage()).toEqual({ day: 10, count: 90 })
    const off = make({ results: new Error('offline') })
    expect(await off.s.find(dark)).toEqual([])
    expect(off.cache()).toEqual({})
  })
})

describe('ytTrailers: chave', () => {
  it('status mostra se tem chave e quantas buscas restam hoje', async () => {
    expect(await make({ usage: { day: 10, count: 4 } }).s.status()).toEqual({ configured: true, left: 86 })
  })
  it('chave do TMDB colada aqui: avisa sem perguntar ao YouTube', async () => {
    const { s, yt, secrets } = make({ key: '' })
    expect((await s.setKey('eyJabc.def.ghi')).msg).toMatch(/TMDB/)
    expect(yt.ping).not.toHaveBeenCalled()
    expect(secrets.set).not.toHaveBeenCalled()
  })
  it('chave aceita é salva sem espaços; recusada não', async () => {
    const { s, yt, secrets } = make({ key: '' })
    expect((await s.setKey(' AIza abc ')).ok).toBe(true)
    expect(secrets.set).toHaveBeenCalledWith('youtube', 'AIzaabc')
    yt.ping.mockResolvedValue(false)
    expect((await s.setKey('AIzaOutra')).ok).toBe(false)
  })
  it('remover a chave', async () => {
    const { s, secrets } = make()
    expect((await s.clearKey()).ok).toBe(true)
    expect(secrets.clear).toHaveBeenCalledWith('youtube')
  })
})
