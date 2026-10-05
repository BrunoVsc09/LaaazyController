import { describe, it, expect, vi } from 'vitest'
import mod from './covers.js'

function make({ key = 'K', cache = {}, found = { Hades: 7 }, grids = { 7: [{ url: 'https://sgdb/hades.png' }] }, pingOk = true } = {}) {
  let saved = key
  let stored = cache
  const sgdb = {
    ping: vi.fn(async () => pingOk),
    searchGame: vi.fn(async (_k, name) => (found[name] ? [{ id: found[name], name }] : [])),
    grids: vi.fn(async (_k, id) => grids[id] || []),
  }
  const secrets = { get: () => saved, set: vi.fn((_n, v) => { saved = v; return true }), clear: vi.fn(() => { saved = '' }) }
  const covers = mod.createCovers({
    sgdb, secrets, now: () => 1000,
    readCache: async () => stored,
    writeCache: vi.fn(async (c) => { stored = c; return true }),
  })
  return { covers, sgdb, secrets, stored: () => stored }
}

const games = [{ id: 'steam:1', name: 'Portal', cover: 'https://steam/1.jpg' }, { id: 'pc:hades', name: 'Hades' }, { id: 'pc:x', name: 'Desconhecido' }]

describe('covers.fill', () => {
  it('sem chave devolve os jogos como estão, sem chamar a API', async () => {
    const { covers, sgdb } = make({ key: '' })
    expect(await covers.fill(games)).toEqual(games)
    expect(sgdb.searchGame).not.toHaveBeenCalled()
  })
  it('busca capa só para jogos sem capa e guarda o resultado (inclusive "não achou")', async () => {
    const { covers, sgdb, stored } = make()
    const r = await covers.fill(games)
    expect(r.find((g) => g.id === 'pc:hades').cover).toBe('https://sgdb/hades.png')
    expect(r.find((g) => g.id === 'pc:x').cover).toBeUndefined()
    expect(sgdb.searchGame).toHaveBeenCalledTimes(2)
    expect(stored()['pc:x']).toEqual({ url: null, at: 1000 })
  })
  it('com o cache, não chama a API de novo', async () => {
    const { covers, sgdb } = make({ cache: { 'pc:hades': { url: 'https://c', at: 1000 }, 'pc:x': { url: null, at: 1000 } } })
    const r = await covers.fill(games)
    expect(r.find((g) => g.id === 'pc:hades').cover).toBe('https://c')
    expect(sgdb.searchGame).not.toHaveBeenCalled()
  })
  it('erro da API não quebra a lista', async () => {
    const { covers, sgdb } = make()
    sgdb.searchGame.mockRejectedValue(new Error('offline'))
    expect((await covers.fill(games)).map((g) => g.id)).toEqual(['steam:1', 'pc:hades', 'pc:x'])
  })
})

describe('covers: chave', () => {
  it('chave do Gemini colada aqui: avisa sem perguntar ao SteamGridDB', async () => {
    const { covers, secrets, sgdb } = make({ key: '' })
    expect((await covers.setKey('AIza' + 'x'.repeat(35))).msg).toMatch(/chave do Gemini/)
    expect(sgdb.ping).not.toHaveBeenCalled()
    expect(secrets.set).not.toHaveBeenCalled()
  })
  it('chave recusada não é salva', async () => {
    const { covers, secrets } = make({ key: '', pingOk: false })
    expect((await covers.setKey('X')).ok).toBe(false)
    expect(secrets.set).not.toHaveBeenCalled()
  })
  it('chave aceita é salva e o "não achou" antigo é esquecido', async () => {
    const { covers, secrets, stored } = make({ key: '', cache: { 'pc:x': { url: null, at: 1 } } })
    expect((await covers.setKey(' BO A\n')).ok).toBe(true)
    expect(secrets.set).toHaveBeenCalledWith('steamgriddb', 'BOA')
    expect(stored()).toEqual({})
  })
  it('status e clearKey', async () => {
    const { covers, secrets } = make()
    expect(covers.status()).toEqual({ configured: true })
    await covers.clearKey()
    expect(secrets.clear).toHaveBeenCalledWith('steamgriddb')
  })
})
