import { describe, it, expect } from 'vitest'
import mod from './explore.js'
import opts from '../../shared/explore-options.js'

const TODAY = '2026-10-04'

describe('opções de Explorar (compartilhadas com a tela)', () => {
  it('tipos, durações, ordens e 18 categorias com nome em português', () => {
    expect(opts.KINDS.map((k) => k.id)).toEqual(['any', 'movie', 'tv'])
    expect(opts.DURATIONS.map((d) => d.id)).toEqual(['any', 'short', 'medium', 'long'])
    expect(opts.SORTS.map((s) => s.id)).toEqual(['popular', 'recent', 'rated'])
    expect(opts.GENRES).toHaveLength(18)
    expect(opts.GENRES.find((g) => g.id === 'ficcao_cientifica').label).toBe('Ficção científica')
  })
})

describe('toSelection: só valores conhecidos', () => {
  it('padrões', () => {
    expect(mod.toSelection({})).toEqual({ kind: 'any', genre: '', duration: 'any', sort: 'popular' })
  })
  it('valores desconhecidos voltam ao padrão', () => {
    expect(mod.toSelection({ kind: 'podcast', genre: 'hackear', duration: 'eterno', sort: 'aleatorio' }))
      .toEqual({ kind: 'any', genre: '', duration: 'any', sort: 'popular' })
    expect(mod.toSelection(null)).toEqual({ kind: 'any', genre: '', duration: 'any', sort: 'popular' })
  })
})

describe('exploreParams', () => {
  const sel = (over = {}) => mod.toSelection(over)
  it('populares de comédia até 1h30, nos seus serviços', () => {
    const p = mod.exploreParams(sel({ genre: 'comedia', duration: 'short' }), 'movie', [8, 119], TODAY)
    expect(p).toMatchObject({ with_genres: '35', 'with_runtime.lte': 90, sort_by: 'popularity.desc', with_watch_providers: '8|119', watch_region: 'BR' })
  })
  it('1h30 a 2h e mais de 2h', () => {
    expect(mod.exploreParams(sel({ duration: 'medium' }), 'movie', [8], TODAY)).toMatchObject({ 'with_runtime.gte': 90, 'with_runtime.lte': 120 })
    const long = mod.exploreParams(sel({ duration: 'long' }), 'movie', [8], TODAY)
    expect(long['with_runtime.gte']).toBe(120)
    expect(long['with_runtime.lte']).toBeUndefined()
  })
  it('duração não vale para séries (é por episódio)', () => {
    expect(mod.exploreParams(sel({ duration: 'short' }), 'tv', [8], TODAY)['with_runtime.lte']).toBeUndefined()
  })
  it('mais recentes: só já lançados e com algumas avaliações', () => {
    expect(mod.exploreParams(sel({ sort: 'recent' }), 'movie', [8], TODAY)).toMatchObject({ sort_by: 'primary_release_date.desc', 'primary_release_date.lte': TODAY, 'vote_count.gte': 10 })
    expect(mod.exploreParams(sel({ sort: 'recent' }), 'tv', [8], TODAY)).toMatchObject({ sort_by: 'first_air_date.desc', 'first_air_date.lte': TODAY })
  })
  it('mais bem avaliados: com muitas avaliações', () => {
    expect(mod.exploreParams(sel({ sort: 'rated' }), 'movie', [8], TODAY)).toMatchObject({ sort_by: 'vote_average.desc', 'vote_count.gte': 200 })
  })
  it('categoria que não existe para séries (terror): séries ficam de fora', () => {
    expect(mod.exploreParams(sel({ genre: 'terror' }), 'tv', [8], TODAY)).toBeNull()
    expect(mod.exploreParams(sel({ genre: 'terror' }), 'movie', [8], TODAY).with_genres).toBe('27')
  })
  it('kindsFor', () => {
    expect(mod.kindsFor(sel({ kind: 'any' }))).toEqual(['movie', 'tv'])
    expect(mod.kindsFor(sel({ kind: 'tv' }))).toEqual(['tv'])
  })
})
