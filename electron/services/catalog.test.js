import { describe, it, expect, vi } from 'vitest'
import mod from './catalog.js'

const HOUR = 3600 * 1000
const providers = [
  { provider_id: 8, provider_name: 'Netflix' },
  { provider_id: 119, provider_name: 'Amazon Prime Video' },
]

function make({ key = 'TOKEN', cache = null, pingOk = true, fail = false, secretOk = true } = {}) {
  let t = 10 * HOUR
  let saved = key
  let stored = cache
  const tmdb = {
    ping: vi.fn(async () => pingOk),
    providers: vi.fn(async () => { if (fail) throw new Error('offline'); return providers }),
    discover: vi.fn(async (_t, kind, pid) => [{ id: pid, name: `S${pid}`, title: `F${pid}`, popularity: pid }]),
    videos: vi.fn(async () => [{ site: 'YouTube', type: 'Trailer', key: 'yt1', official: true }]),
  }
  const secrets = {
    get: () => saved,
    set: vi.fn((_n, v) => { if (!secretOk) return false; saved = v; return true }),
    clear: vi.fn(() => { saved = '' }),
  }
  const catalog = mod.createCatalog({
    tmdb, secrets,
    readCache: async () => stored,
    writeCache: vi.fn(async (c) => { stored = c; return true }),
    now: () => t,
  })
  return { catalog, tmdb, secrets, advance: (ms) => { t += ms }, stored: () => stored }
}

describe('catalog.home', () => {
  it('sem chave pede para configurar', async () => {
    const r = await make({ key: '' }).catalog.home()
    expect(r).toMatchObject({ ok: false, configured: false, series: [], films: [] })
    expect(r.msg).toMatch(/Configurações/)
  })
  it('busca séries e filmes em alta em cada serviço e guarda no cache', async () => {
    const { catalog, tmdb, stored } = make()
    const r = await catalog.home()
    expect(r.ok).toBe(true)
    expect(r.series.map((s) => s.title)).toEqual(['S119', 'S8'])
    expect(r.series[0].services).toEqual(['Prime Video'])
    expect(r.films.map((s) => s.title)).toEqual(['F119', 'F8'])
    expect(tmdb.discover).toHaveBeenCalledTimes(4)
    expect(stored().series).toHaveLength(2)
  })
  it('usa o cache por 6 horas; fresh ignora o cache', async () => {
    const { catalog, tmdb, advance } = make()
    await catalog.home(); await catalog.home()
    expect(tmdb.providers).toHaveBeenCalledTimes(2) // tv + movie, uma vez só
    advance(6 * HOUR + 1); await catalog.home()
    expect(tmdb.providers).toHaveBeenCalledTimes(4)
    await catalog.home({ fresh: true })
    expect(tmdb.providers).toHaveBeenCalledTimes(6)
  })
  it('sem internet mostra a última lista com aviso', async () => {
    const cache = { at: 0, series: [{ id: 'tv:1', title: 'Velha' }], films: [] }
    const r = await make({ fail: true, cache }).catalog.home()
    expect(r).toMatchObject({ ok: true, stale: true, series: [{ title: 'Velha' }] })
    expect(r.msg).toMatch(/última lista/)
  })
  it('sem internet e sem cache: erro claro', async () => {
    const r = await make({ fail: true }).catalog.home()
    expect(r.ok).toBe(false)
    expect(r.msg).toMatch(/Não consegui falar com o TMDB/)
  })
})

describe('catalog: chave', () => {
  it('status', () => {
    expect(make().catalog.status()).toEqual({ configured: true })
    expect(make({ key: '' }).catalog.status()).toEqual({ configured: false })
  })
  it('chave vazia é recusada', async () => {
    const { catalog, secrets } = make({ key: '' })
    expect((await catalog.setKey('   ')).ok).toBe(false)
    expect(secrets.set).not.toHaveBeenCalled()
  })
  it('chave recusada pelo TMDB não é salva', async () => {
    const { catalog, secrets } = make({ key: '', pingOk: false })
    expect(await catalog.setKey('ERRADA')).toEqual({ ok: false, msg: 'O TMDB recusou essa chave. Cole a "Chave da API" (32 letras e números) ou o "Token de Leitura da API" (texto longo que começa com eyJ), sem espaços.' })
    expect(secrets.set).not.toHaveBeenCalled()
  })
  it('chave aceita é salva (sem espaços) e o cache antigo cai', async () => {
    const { catalog, secrets, stored } = make({ key: '', cache: { at: 0, series: [], films: [] } })
    expect((await catalog.setKey('  BOA  ')).ok).toBe(true)
    expect(secrets.set).toHaveBeenCalledWith('tmdb', 'BOA')
    expect(stored()).toBeNull()
  })
  it('sem como guardar com segurança, avisa', async () => {
    const r = await make({ key: '', secretOk: false }).catalog.setKey('BOA')
    expect(r).toEqual({ ok: false, msg: 'Não consegui guardar a chave com segurança neste PC.' })
  })
  it('clearKey apaga a chave e o cache', async () => {
    const { catalog, secrets, stored } = make({ cache: { at: 0, series: [], films: [] } })
    await catalog.clearKey()
    expect(secrets.clear).toHaveBeenCalledWith('tmdb')
    expect(stored()).toBeNull()
  })
})

describe('catalog.trailer', () => {
  it('devolve a chave do vídeo do YouTube e guarda em memória', async () => {
    const { catalog, tmdb } = make()
    expect(await catalog.trailer('movie:5')).toBe('yt1')
    expect(await catalog.trailer('movie:5')).toBe('yt1')
    expect(tmdb.videos).toHaveBeenCalledTimes(1)
    expect(tmdb.videos).toHaveBeenCalledWith('TOKEN', 'movie', 5)
  })
  it('id inválido, sem chave ou erro: null', async () => {
    expect(await make().catalog.trailer('x')).toBeNull()
    expect(await make({ key: '' }).catalog.trailer('tv:1')).toBeNull()
    const { catalog, tmdb } = make()
    tmdb.videos.mockRejectedValue(new Error('x'))
    expect(await catalog.trailer('tv:1')).toBeNull()
  })
})

describe('catalog.search e where', () => {
  function withSearch(opts) {
    const m = make(opts)
    m.tmdb.search = vi.fn(async () => [{ id: 9, media_type: 'movie', title: 'Duna', popularity: 3 }])
    m.tmdb.watchProviders = vi.fn(async () => [{ provider_name: 'HBO Max' }])
    return m
  }
  it('busca títulos', async () => {
    const { catalog, tmdb } = withSearch()
    const r = await catalog.search('  duna ')
    expect(r).toMatchObject({ ok: true, items: [{ id: 'movie:9', title: 'Duna' }] })
    expect(tmdb.search).toHaveBeenCalledWith('TOKEN', 'duna')
  })
  it('busca curta não chama o TMDB', async () => {
    const { catalog, tmdb } = withSearch()
    expect(await catalog.search('d')).toEqual({ ok: true, configured: true, items: [] })
    expect(tmdb.search).not.toHaveBeenCalled()
  })
  it('sem chave avisa', async () => {
    expect(await withSearch({ key: '' }).catalog.search('duna')).toMatchObject({ ok: false, configured: false, items: [] })
  })
  it('erro vira mensagem', async () => {
    const { catalog, tmdb } = withSearch()
    tmdb.search.mockRejectedValue(new Error('offline'))
    expect((await catalog.search('duna')).msg).toMatch(/Não consegui buscar/)
  })
  it('where diz em quais serviços do app o título está, com memória', async () => {
    const { catalog, tmdb } = withSearch()
    expect(await catalog.where('movie:9')).toEqual(['HBO Max'])
    expect(await catalog.where('movie:9')).toEqual(['HBO Max'])
    expect(tmdb.watchProviders).toHaveBeenCalledTimes(1)
    expect(await catalog.where('lixo')).toEqual([])
  })
})

describe('catalog.episodes', () => {
  const serie = (id) => ({ id, kind: 'Série', title: id, services: [] })
  function withDetails(details, opts) {
    const m = make(opts)
    m.tmdb.tvDetails = vi.fn(async (_k, id) => details[id] || {})
    return m
  }
  it('só séries da lista com novidade, e a data de hoje vem do relógio', async () => {
    // now() = 10h de 1/1/1970 → hoje = 1970-01-01
    const { catalog, tmdb } = withDetails({ 1: { last_episode_to_air: { air_date: '1970-01-01', season_number: 1, episode_number: 2 } }, 2: {} })
    const r = await catalog.episodes([serie('tv:1'), serie('tv:2'), { id: 'movie:3', kind: 'Filme', title: 'F' }])
    expect(r).toEqual([{ id: 'tv:1', label: 'Episódio novo: T1E2', kind: 'new', date: '1970-01-01' }])
    expect(tmdb.tvDetails).toHaveBeenCalledTimes(2)
  })
  it('guarda por 6 horas', async () => {
    const { catalog, tmdb, advance } = withDetails({})
    await catalog.episodes([serie('tv:1')]); await catalog.episodes([serie('tv:1')])
    expect(tmdb.tvDetails).toHaveBeenCalledTimes(1)
    advance(6 * HOUR + 1); await catalog.episodes([serie('tv:1')])
    expect(tmdb.tvDetails).toHaveBeenCalledTimes(2)
  })
  it('sem chave ou com erro: lista vazia', async () => {
    expect(await withDetails({}, { key: '' }).catalog.episodes([serie('tv:1')])).toEqual([])
    const { catalog, tmdb } = withDetails({})
    tmdb.tvDetails.mockRejectedValue(new Error('x'))
    expect(await catalog.episodes([serie('tv:1')])).toEqual([])
  })
})
