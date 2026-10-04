import { describe, it, expect, vi } from 'vitest'
import mod from './sgdb.js'

const fakeFetch = (status = 200, body = {}) =>
  vi.fn(async () => ({ ok: status >= 200 && status < 300, status, json: async () => body }))

describe('SteamGridDB adapter', () => {
  it('busca o jogo pelo nome (codificado) com a chave como Bearer', async () => {
    const fetch = fakeFetch(200, { success: true, data: [{ id: 7, name: 'Hades' }] })
    expect(await mod.createSgdb({ fetch }).searchGame('K', 'Hades II')).toEqual([{ id: 7, name: 'Hades' }])
    const [url, opts] = fetch.mock.calls[0]
    expect(url).toBe('https://www.steamgriddb.com/api/v2/search/autocomplete/Hades%20II')
    expect(opts.headers.Authorization).toBe('Bearer K')
  })
  it('grids no formato horizontal da biblioteca', async () => {
    const fetch = fakeFetch(200, { success: true, data: [{ url: 'u' }] })
    expect(await mod.createSgdb({ fetch }).grids('K', 7)).toEqual([{ url: 'u' }])
    const u = new URL(fetch.mock.calls[0][0])
    expect(u.pathname).toBe('/api/v2/grids/game/7')
    expect(u.searchParams.get('dimensions')).toBe('460x215,920x430')
  })
  it('ping: true com chave aceita, false com chave recusada', async () => {
    expect(await mod.createSgdb({ fetch: fakeFetch(200, { success: true, data: [] }) }).ping('K')).toBe(true)
    expect(await mod.createSgdb({ fetch: fakeFetch(401) }).ping('K')).toBe(false)
  })
  it('erro HTTP vira exceção', async () => {
    await expect(mod.createSgdb({ fetch: fakeFetch(500) }).grids('K', 1)).rejects.toThrow(/500/)
  })
})
