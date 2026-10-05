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
    ping: vi.fn(async () => (pingOk === true ? { ok: true } : pingOk === false ? { ok: false, reason: 'refused' } : pingOk)),
    providers: vi.fn(async () => { if (fail) throw new Error('offline'); return providers }),
    discover: vi.fn(async (_t, kind, pid) => [{ id: pid, name: `S${pid}`, title: `F${pid}`, popularity: pid }, { id: 900 + pid, name: `A${pid}`, title: `AF${pid}`, popularity: 1, original_language: 'ja', genre_ids: [16] }]),
    videos: vi.fn(async () => [{ site: 'YouTube', type: 'Trailer', key: 'yt1', official: true, iso_639_1: 'pt', iso_3166_1: 'BR' }]),
    seasonVideos: vi.fn(async () => [{ site: 'YouTube', type: 'Trailer', key: 's1', iso_639_1: 'en', iso_3166_1: 'US' }]),
  }
  const secrets = {
    get: () => saved,
    set: vi.fn((_n, v) => { if (!secretOk) return false; saved = v; return true }),
    clear: vi.fn(() => { saved = '' }),
  }
  const findPt = vi.fn(async () => [])
  const catalog = mod.createCatalog({
    tmdb, secrets, findPt,
    readCache: async () => stored,
    writeCache: vi.fn(async (c) => { stored = c; return true }),
    now: () => t,
  })
  return { catalog, tmdb, secrets, findPt, advance: (ms) => { t += ms }, stored: () => stored }
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
    // animes (séries e filmes) saem das outras fileiras e ganham a sua
    expect(r.animes.map((s) => s.title).sort()).toEqual(['A119', 'A8', 'AF119', 'AF8'])
    expect(tmdb.discover).toHaveBeenCalledTimes(12) // 2 serviços × 2 tipos × 3 páginas
    expect(tmdb.discover.mock.calls.map((c) => c[3]).sort()).toEqual([1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3])
    expect(stored().series).toHaveLength(2)
  })
  it('lista guardada por uma versão antiga do app (sem v: 3) é buscada de novo na hora', async () => {
    const { catalog, tmdb, stored } = make({ cache: { at: 10 * HOUR, series: [{ id: 'tv:1', title: 'Velha' }], films: [] } })
    const r = await catalog.home()
    expect(tmdb.providers).toHaveBeenCalled()
    expect(r.series.map((s) => s.title)).not.toContain('Velha')
    expect(stored().v).toBe(3)
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
  it('chave do Gemini colada aqui: avisa sem perguntar ao TMDB', async () => {
    const { catalog, secrets, tmdb } = make({ key: '' })
    expect((await catalog.setKey('AIza' + 'x'.repeat(35))).msg).toMatch(/chave do Gemini/)
    expect(tmdb.ping).not.toHaveBeenCalled()
    expect(secrets.set).not.toHaveBeenCalled()
  })
  it('chave recusada pelo TMDB não é salva', async () => {
    const { catalog, secrets } = make({ key: '', pingOk: false })
    expect(await catalog.setKey('ERRADA')).toEqual({ ok: false, msg: 'O TMDB recusou essa chave. Cole a "Chave da API" (32 letras e números) ou o "Token de Leitura da API" (texto longo que começa com eyJ), sem espaços.' })
    expect(secrets.set).not.toHaveBeenCalled()
  })
  it('sem conexão com o TMDB não diz que a chave foi recusada', async () => {
    const { catalog, secrets } = make({ key: '', pingOk: { ok: false, reason: 'offline', detail: 'fetch failed' } })
    const r = await catalog.setKey('BOA')
    expect(r.ok).toBe(false)
    expect(r.msg).toMatch(/Não consegui falar com o TMDB/)
    expect(r.msg).not.toMatch(/recusou/)
    expect(secrets.set).not.toHaveBeenCalled()
  })
  it('chave aceita é salva (sem espaços nem quebras, inclusive no meio) e o cache antigo cai', async () => {
    const { catalog, secrets, stored } = make({ key: '', cache: { at: 0, series: [], films: [] } })
    expect((await catalog.setKey('  BO\nA  ')).ok).toBe(true)
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
  it('devolve os trailers do YouTube (melhor primeiro) e guarda em memória', async () => {
    const { catalog, tmdb } = make()
    expect(await catalog.trailer('movie:5')).toEqual([{ key: 'yt1', lang: 'pt' }])
    expect(await catalog.trailer('movie:5')).toEqual([{ key: 'yt1', lang: 'pt' }])
    expect(tmdb.videos).toHaveBeenCalledTimes(1)
    expect(tmdb.videos).toHaveBeenCalledWith('TOKEN', 'movie', 5)
  })
  it('com o título: trailer dublado/legendado do YouTube vem antes dos do TMDB', async () => {
    const { catalog, findPt } = make()
    findPt.mockResolvedValue([{ key: 'dub', lang: 'pt', label: 'dublado' }])
    expect(await catalog.trailer('movie:5', { title: 'Duna', year: '2021' })).toEqual([{ key: 'dub', lang: 'pt', label: 'dublado' }, { key: 'yt1', lang: 'pt' }])
    expect(findPt).toHaveBeenCalledWith({ id: 'movie:5', title: 'Duna', year: '2021' })
  })
  it('sem o título (ou YouTube com erro): só os do TMDB', async () => {
    const { catalog, findPt } = make()
    expect(await catalog.trailer('movie:5')).toEqual([{ key: 'yt1', lang: 'pt' }])
    expect(findPt).not.toHaveBeenCalled()
    const b = make()
    b.findPt.mockRejectedValue(new Error('x'))
    expect(await b.catalog.trailer('movie:6', { title: 'X', year: '' })).toEqual([{ key: 'yt1', lang: 'pt' }])
  })
  it('série sem vídeo no cadastro geral: procura na 1ª temporada', async () => {
    const { catalog, tmdb } = make()
    tmdb.videos.mockResolvedValue([])
    expect(await catalog.trailer('tv:7')).toEqual([{ key: 's1', lang: 'en' }])
    expect(tmdb.seasonVideos).toHaveBeenCalledWith('TOKEN', 7, 1)
    tmdb.seasonVideos.mockClear()
    await catalog.trailer('movie:8') // filme não tem temporada
    expect(tmdb.seasonVideos).not.toHaveBeenCalled()
  })
  it('id inválido, sem chave ou erro: lista vazia', async () => {
    expect(await make().catalog.trailer('x')).toEqual([])
    expect(await make({ key: '' }).catalog.trailer('tv:1')).toEqual([])
    const { catalog, tmdb } = make()
    tmdb.videos.mockRejectedValue(new Error('x'))
    expect(await catalog.trailer('tv:1')).toEqual([])
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

describe('catalog.explore (sem digitar)', () => {
  function withExplore(results, opts) {
    const m = make(opts)
    m.tmdb.discoverWith = vi.fn(async (_k, kind) => results[kind] || [])
    return m
  }
  it('filmes e séries dos seus serviços, populares primeiro', async () => {
    const { catalog, tmdb } = withExplore({
      movie: [{ id: 1, title: 'F1', popularity: 5, release_date: '2020-01-01' }],
      tv: [{ id: 2, name: 'S2', popularity: 9, first_air_date: '2021-01-01' }],
    })
    const r = await catalog.explore({ sort: 'popular' })
    expect(r.ok).toBe(true)
    expect(r.items.map((x) => x.title)).toEqual(['S2', 'F1'])
    expect(tmdb.discoverWith.mock.calls[0][2].with_watch_providers).toBe('8|119')
  })
  it('mais recentes: ordena pela data de lançamento', async () => {
    const { catalog } = withExplore({
      movie: [{ id: 1, title: 'Velho', popularity: 99, release_date: '2010-01-01' }],
      tv: [{ id: 2, name: 'Novo', popularity: 1, first_air_date: '2026-09-01' }],
    })
    expect((await catalog.explore({ sort: 'recent' })).items.map((x) => x.title)).toEqual(['Novo', 'Velho'])
  })
  it('categoria só de filmes não busca séries', async () => {
    const { catalog, tmdb } = withExplore({ movie: [] })
    await catalog.explore({ genre: 'terror' })
    expect(tmdb.discoverWith.mock.calls.map((c) => c[1])).toEqual(['movie'])
  })
  it('sem chave avisa; erro vira mensagem', async () => {
    expect(await withExplore({}, { key: '' }).catalog.explore({})).toMatchObject({ ok: false, configured: false, items: [] })
    const { catalog, tmdb } = withExplore({})
    tmdb.discoverWith.mockRejectedValue(new Error('offline'))
    expect((await catalog.explore({})).msg).toMatch(/Não consegui buscar/)
  })
})
