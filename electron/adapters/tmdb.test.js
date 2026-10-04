import { describe, it, expect, vi } from 'vitest'
import mod from './tmdb.js'

function fakeFetch(status = 200, body = {}) {
  return vi.fn(async () => ({ ok: status >= 200 && status < 300, status, json: async () => body }))
}

describe('tmdb adapter', () => {
  it('manda a chave como Bearer e pede em português do Brasil', async () => {
    const fetch = fakeFetch(200, { results: [{ id: 1 }] })
    const tmdb = mod.createTmdb({ fetch })
    expect(await tmdb.discover('TOKEN', 'tv', 8)).toEqual([{ id: 1 }])
    const [url, opts] = fetch.mock.calls[0]
    const u = new URL(url)
    expect(u.origin + u.pathname).toBe('https://api.themoviedb.org/3/discover/tv')
    expect(Object.fromEntries(u.searchParams)).toMatchObject({
      watch_region: 'BR', with_watch_providers: '8', with_watch_monetization_types: 'flatrate',
      sort_by: 'popularity.desc', language: 'pt-BR',
    })
    expect(opts.headers.Authorization).toBe('Bearer TOKEN')
  })
  it('providers e videos', async () => {
    const fetch = fakeFetch(200, { results: [] })
    const tmdb = mod.createTmdb({ fetch })
    await tmdb.providers('T', 'movie')
    await tmdb.videos('T', 'movie', 42)
    expect(new URL(fetch.mock.calls[0][0]).pathname).toBe('/3/watch/providers/movie')
    expect(new URL(fetch.mock.calls[1][0]).pathname).toBe('/3/movie/42/videos')
  })
  it('ping diz se a chave foi aceita, recusada ou se não deu para falar com o TMDB', async () => {
    expect(await mod.createTmdb({ fetch: fakeFetch(200, { success: true }) }).ping('T')).toEqual({ ok: true })
    expect(await mod.createTmdb({ fetch: fakeFetch(401, {}) }).ping('T')).toEqual({ ok: false, reason: 'refused' })
    const offline = vi.fn(async () => { throw new Error('fetch failed') })
    expect(await mod.createTmdb({ fetch: offline }).ping('T')).toEqual({ ok: false, reason: 'offline', detail: 'fetch failed' })
    expect(await mod.createTmdb({ fetch: fakeFetch(503, {}) }).ping('T')).toEqual({ ok: false, reason: 'offline', detail: 'O TMDB respondeu com erro 503.' })
  })
  it('erro HTTP vira exceção com mensagem clara', async () => {
    await expect(mod.createTmdb({ fetch: fakeFetch(401) }).discover('T', 'tv', 8)).rejects.toThrow(/recusou a chave/)
    await expect(mod.createTmdb({ fetch: fakeFetch(503) }).discover('T', 'tv', 8)).rejects.toThrow(/503/)
  })
})

describe('tmdb: busca e onde assistir', () => {
  it('search usa /search/multi em pt-BR sem conteúdo adulto', async () => {
    const fetch = fakeFetch(200, { results: [{ id: 1 }] })
    expect(await mod.createTmdb({ fetch }).search('T', 'duna')).toEqual([{ id: 1 }])
    const u = new URL(fetch.mock.calls[0][0])
    expect(u.pathname).toBe('/3/search/multi')
    expect(Object.fromEntries(u.searchParams)).toMatchObject({ query: 'duna', language: 'pt-BR', include_adult: 'false' })
  })
  it('watchProviders devolve os de assinatura no Brasil', async () => {
    const fetch = fakeFetch(200, { results: { BR: { flatrate: [{ provider_name: 'Netflix' }] }, US: { flatrate: [] } } })
    expect(await mod.createTmdb({ fetch }).watchProviders('T', 'tv', 5)).toEqual([{ provider_name: 'Netflix' }])
    expect(new URL(fetch.mock.calls[0][0]).pathname).toBe('/3/tv/5/watch/providers')
  })
  it('watchProviders sem Brasil devolve lista vazia', async () => {
    expect(await mod.createTmdb({ fetch: fakeFetch(200, { results: {} }) }).watchProviders('T', 'tv', 5)).toEqual([])
  })
})

describe('tmdb: detalhes da série', () => {
  it('tvDetails em pt-BR', async () => {
    const fetch = fakeFetch(200, { id: 5, next_episode_to_air: null })
    expect(await mod.createTmdb({ fetch }).tvDetails('T', 5)).toEqual({ id: 5, next_episode_to_air: null })
    const u = new URL(fetch.mock.calls[0][0])
    expect(u.pathname).toBe('/3/tv/5')
    expect(u.searchParams.get('language')).toBe('pt-BR')
  })
})

describe('tmdb: discover com filtros e recomendações', () => {
  it('discoverWith repassa os parâmetros', async () => {
    const fetch = fakeFetch(200, { results: [{ id: 1 }] })
    expect(await mod.createTmdb({ fetch }).discoverWith('T', 'movie', { with_genres: '35', 'with_runtime.lte': 90 })).toEqual([{ id: 1 }])
    const u = new URL(fetch.mock.calls[0][0])
    expect(u.pathname).toBe('/3/discover/movie')
    expect(u.searchParams.get('with_genres')).toBe('35')
    expect(u.searchParams.get('with_runtime.lte')).toBe('90')
  })
  it('recommendations em pt-BR', async () => {
    const fetch = fakeFetch(200, { results: [{ id: 2 }] })
    expect(await mod.createTmdb({ fetch }).recommendations('T', 'tv', 9)).toEqual([{ id: 2 }])
    expect(new URL(fetch.mock.calls[0][0]).pathname).toBe('/3/tv/9/recommendations')
  })
})

describe('tmdb: os dois tipos de credencial', () => {
  const V3 = '0123456789abcdef0123456789abcdef' // "Chave da API" (32 caracteres)
  it('Chave da API (32 caracteres) vai como api_key, sem cabeçalho Authorization', async () => {
    const fetch = fakeFetch(200, { results: [] })
    await mod.createTmdb({ fetch }).discover(V3, 'tv', 8)
    const [url, opts] = fetch.mock.calls[0]
    expect(new URL(url).searchParams.get('api_key')).toBe(V3)
    expect(opts.headers.Authorization).toBeUndefined()
  })
  it('Token de Leitura (longo, eyJ...) vai como Bearer, fora da URL', async () => {
    const fetch = fakeFetch(200, { results: [] })
    await mod.createTmdb({ fetch }).discover('eyJhbGciOiJIUzI1NiJ9.abc.def', 'tv', 8)
    const [url, opts] = fetch.mock.calls[0]
    expect(url).not.toContain('eyJ')
    expect(opts.headers.Authorization).toBe('Bearer eyJhbGciOiJIUzI1NiJ9.abc.def')
  })
  it('ping funciona com a Chave da API', async () => {
    const fetch = fakeFetch(200, { success: true })
    expect(await mod.createTmdb({ fetch }).ping(V3)).toEqual({ ok: true })
    expect(new URL(fetch.mock.calls[0][0]).searchParams.get('api_key')).toBe(V3)
  })
})
