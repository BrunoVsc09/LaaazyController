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

describe('pickTrailer', () => {
  it('prefere trailer oficial do YouTube', () => {
    const v = [
      { site: 'YouTube', type: 'Teaser', key: 't1', official: true },
      { site: 'Vimeo', type: 'Trailer', key: 'v1', official: true },
      { site: 'YouTube', type: 'Trailer', key: 'y1', official: false },
      { site: 'YouTube', type: 'Trailer', key: 'y2', official: true },
    ]
    expect(cat.pickTrailer(v)).toBe('y2')
  })
  it('sem trailer, aceita teaser do YouTube; sem nada, null', () => {
    expect(cat.pickTrailer([{ site: 'YouTube', type: 'Teaser', key: 't1' }])).toBe('t1')
    expect(cat.pickTrailer([{ site: 'Vimeo', type: 'Trailer', key: 'v' }])).toBeNull()
    expect(cat.pickTrailer(undefined)).toBeNull()
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
