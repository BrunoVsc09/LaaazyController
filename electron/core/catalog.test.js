import { describe, it, expect } from 'vitest'
import cat from './catalog.js'

describe('resolveProviders', () => {
  const list = [
    { provider_id: 8, provider_name: 'Netflix' },
    { provider_id: 119, provider_name: 'Amazon Prime Video' },
    { provider_id: 1899, provider_name: 'HBO Max' },
    { provider_id: 283, provider_name: 'Crunchyroll' },
    { provider_id: 9999, provider_name: 'Netflix Basic with Ads' },
  ]
  it('acha o id de cada serviço pelo nome, sem confundir com variações', () => {
    expect(cat.resolveProviders(list)).toEqual({ Netflix: 8, 'Prime Video': 119, 'HBO Max': 1899, Crunchyroll: 283 })
  })
  it('aceita o nome antigo "Max" para a HBO Max', () => {
    expect(cat.resolveProviders([{ provider_id: 1899, provider_name: 'Max' }])).toEqual({ 'HBO Max': 1899 })
  })
  it('serviço que não está no Brasil fica de fora', () => {
    expect(cat.resolveProviders([{ provider_id: 8, provider_name: 'netflix' }])).toEqual({ Netflix: 8 })
    expect(cat.resolveProviders(undefined)).toEqual({})
  })
})

describe('toItem', () => {
  it('série', () => {
    const raw = { id: 1, name: 'Série X', overview: 'Sinopse', first_air_date: '2024-05-01', poster_path: '/p.jpg', backdrop_path: '/b.jpg', popularity: 50 }
    expect(cat.toItem(raw, 'tv', 'Netflix')).toEqual({
      id: 'tv:1', kind: 'Série', title: 'Série X', year: '2024', overview: 'Sinopse',
      poster: 'https://image.tmdb.org/t/p/w342/p.jpg', backdrop: 'https://image.tmdb.org/t/p/w1280/b.jpg',
      popularity: 50, services: ['Netflix'],
    })
  })
  it('filme usa title e release_date', () => {
    const it2 = cat.toItem({ id: 2, title: 'Filme Y', release_date: '2023-01-01' }, 'movie', 'Prime Video')
    expect(it2).toMatchObject({ id: 'movie:2', kind: 'Filme', title: 'Filme Y', year: '2023', poster: '', backdrop: '', overview: '', popularity: 0 })
  })
  it('anime (animação japonesa) vem marcado; o resto não ganha o campo', () => {
    expect(cat.toItem({ id: 4, name: 'Frieren', original_language: 'ja', genre_ids: [16, 10765] }, 'tv')).toMatchObject({ anime: true })
    expect(cat.toItem({ id: 5, name: 'Arcane', original_language: 'en', genre_ids: [16] }, 'tv')).not.toHaveProperty('anime')
    expect(cat.toItem({ id: 6, name: 'Dorama', original_language: 'ja', genre_ids: [18] }, 'tv')).not.toHaveProperty('anime')
  })
  it('sem título não vira item', () => {
    expect(cat.toItem({ id: 3 }, 'tv', 'Netflix')).toBeNull()
  })
})

describe('mergeLists', () => {
  const a = { service: 'Netflix', results: [{ id: 1, name: 'A', popularity: 10 }, { id: 2, name: 'B', popularity: 90 }] }
  const b = { service: 'Prime Video', results: [{ id: 1, name: 'A', popularity: 10 }, { id: 3, name: 'C', popularity: 50 }] }
  it('junta, soma os serviços do mesmo título e ordena por popularidade', () => {
    const r = cat.mergeLists([a, b], 'tv')
    expect(r.map((x) => x.title)).toEqual(['B', 'C', 'A'])
    expect(r.find((x) => x.title === 'A').services).toEqual(['Netflix', 'Prime Video'])
  })
  it('respeita o limite', () => {
    expect(cat.mergeLists([a, b], 'tv', 2)).toHaveLength(2)
  })
})

describe('pickTrailer (prefere português do Brasil)', () => {
  const v = (key, lang, country, type = 'Trailer', official = true, site = 'YouTube') => ({ key, iso_639_1: lang, iso_3166_1: country, type, official, site })
  it('trailer em português do Brasil (dublado ou legendado) vem primeiro', () => {
    expect(cat.pickTrailer([v('en1', 'en', 'US'), v('pt1', 'pt', 'PT'), v('br1', 'pt', 'BR')])).toEqual({ key: 'br1', lang: 'pt' })
  })
  it('sem do Brasil, português de outro país; sem português, inglês', () => {
    expect(cat.pickTrailer([v('en1', 'en', 'US'), v('pt1', 'pt', 'PT')])).toEqual({ key: 'pt1', lang: 'pt' })
    expect(cat.pickTrailer([v('en1', 'en', 'US')])).toEqual({ key: 'en1', lang: 'en' })
  })
  it('português vence mesmo sendo teaser; dentro do mesmo idioma, trailer oficial vence', () => {
    expect(cat.pickTrailer([v('en1', 'en', 'US'), v('br-teaser', 'pt', 'BR', 'Teaser')])).toEqual({ key: 'br-teaser', lang: 'pt' })
    expect(cat.pickTrailer([v('t', 'en', 'US', 'Teaser'), v('a', 'en', 'US', 'Trailer', false), v('b', 'en', 'US', 'Trailer', true)]).key).toBe('b')
  })
  it('só YouTube; sem trailer nem teaser, null', () => {
    expect(cat.pickTrailer([v('x', 'pt', 'BR', 'Trailer', true, 'Vimeo')])).toBeNull()
    expect(cat.pickTrailer([v('c', 'pt', 'BR', 'Clip')])).toBeNull()
    expect(cat.pickTrailer(undefined)).toBeNull()
  })
  it('vídeo sem idioma marcado também serve', () => {
    expect(cat.pickTrailer([{ key: 'n1', site: 'YouTube', type: 'Trailer' }])).toEqual({ key: 'n1', lang: '' })
  })
})

describe('mergeLists: até 40 por fileira', () => {
  it('limite padrão de 40', () => {
    const results = Array.from({ length: 60 }, (_, i) => ({ id: i, name: `S${i}`, popularity: i }))
    expect(cat.mergeLists([{ service: 'Netflix', results }], 'tv')).toHaveLength(40)
  })
})

describe('parseItemId', () => {
  it('lê tipo e id', () => {
    expect(cat.parseItemId('tv:123')).toEqual({ kind: 'tv', id: 123 })
    expect(cat.parseItemId('movie:7')).toEqual({ kind: 'movie', id: 7 })
  })
  it('recusa formato inválido', () => {
    for (const bad of ['tv:abc', 'game:1', '1', '', null, 'tv:1/../x']) expect(cat.parseItemId(bad)).toBeNull()
  })
})

describe('busca (TMDB /search/multi)', () => {
  it('searchItems fica só com séries e filmes, sem serviço ainda', () => {
    const r = cat.searchItems([
      { id: 1, media_type: 'tv', name: 'Série', popularity: 1 },
      { id: 2, media_type: 'person', name: 'Ator' },
      { id: 3, media_type: 'movie', title: 'Filme', popularity: 5 },
    ])
    expect(r.map((x) => [x.id, x.services])).toEqual([['movie:3', []], ['tv:1', []]])
  })
  it('servicesFrom traduz os provedores do Brasil para os serviços do app', () => {
    expect(cat.servicesFrom([{ provider_name: 'Amazon Prime Video' }, { provider_name: 'Globoplay' }, { provider_name: 'Netflix' }]))
      .toEqual(['Prime Video', 'Netflix'])
    expect(cat.servicesFrom(undefined)).toEqual([])
  })
})
