import { describe, it, expect } from 'vitest'
import ai from './ai-filters.js'

const full = (over = {}) => JSON.stringify({
  kind: 'movie', genres: ['comedia'], exclude_genres: [], services: ['Netflix'],
  max_runtime_minutes: 90, min_year: null, max_year: null, min_rating: null,
  similar_to: null, explanation: 'Comédia curta na Netflix.', off_topic: false, ...over,
})

describe('parseAiResponse: só aceita o que está nas listas', () => {
  it('resposta boa vira filtros limpos', () => {
    expect(ai.parseAiResponse(full())).toEqual({
      offTopic: false, kind: 'movie', genres: ['comedia'], excludeGenres: [], services: ['Netflix'],
      maxRuntime: 90, minYear: null, maxYear: null, minRating: null, similarTo: null,
      explanation: 'Comédia curta na Netflix.',
    })
  })
  it('JSON quebrado, vazio ou que não é objeto: null (o app cai na busca normal)', () => {
    for (const bad of ['{"kind":', '', 'null', '[1,2]', '"texto"', undefined]) expect(ai.parseAiResponse(bad)).toBeNull()
  })
  it('fora do assunto', () => {
    expect(ai.parseAiResponse(full({ off_topic: true }))).toEqual({ offTopic: true })
  })
  it('gênero, serviço e tipo inventados são descartados', () => {
    const r = ai.parseAiResponse(full({ kind: 'podcast', genres: ['comedia', 'hackear', 'comedia'], services: ['Netflix', 'Globoplay'] }))
    expect(r).toMatchObject({ kind: 'any', genres: ['comedia'], services: ['Netflix'] })
  })
  it('números fora da faixa viram null', () => {
    const r = ai.parseAiResponse(full({ max_runtime_minutes: 99999, min_year: 1200, max_year: '2020', min_rating: 11 }))
    expect(r).toMatchObject({ maxRuntime: null, minYear: null, maxYear: null, minRating: null })
  })
  it('textos são cortados e limpos de caracteres de controle', () => {
    const r = ai.parseAiResponse(full({ explanation: 'a\u0000b'.padEnd(500, 'x'), similar_to: '  Duna\u0007  ' }))
    expect(r.explanation).toHaveLength(160)
    expect(r.explanation.startsWith('ab')).toBe(true)
    expect(r.similarTo).toBe('Duna')
  })
  it('no máximo 5 gêneros', () => {
    const r = ai.parseAiResponse(full({ genres: ['acao', 'aventura', 'comedia', 'drama', 'terror', 'romance'] }))
    expect(r.genres).toHaveLength(5)
  })
})

describe('discoverParams: filtros → parâmetros do TMDB', () => {
  const f = (over = {}) => ({ offTopic: false, kind: 'any', genres: [], excludeGenres: [], services: [], maxRuntime: null, minYear: null, maxYear: null, minRating: null, similarTo: null, explanation: '', ...over })
  it('filme: gêneros (qualquer um), duração, anos e nota', () => {
    const p = ai.discoverParams(f({ genres: ['comedia', 'familia'], excludeGenres: ['terror'], maxRuntime: 90, minYear: 2010, maxYear: 2020, minRating: 7 }), 'movie', [8, 119])
    expect(p).toMatchObject({
      with_genres: '35|10751', without_genres: '27', 'with_runtime.lte': 90,
      'primary_release_date.gte': '2010-01-01', 'primary_release_date.lte': '2020-12-31',
      'vote_average.gte': 7, 'vote_count.gte': 50,
      with_watch_providers: '8|119', watch_region: 'BR', with_watch_monetization_types: 'flatrate', language: 'pt-BR',
    })
  })
  it('série: usa os gêneros de série do TMDB e a data de estreia; sem duração', () => {
    const p = ai.discoverParams(f({ genres: ['acao', 'ficcao_cientifica'], minYear: 2015, maxRuntime: 60 }), 'tv', [8])
    expect(p.with_genres).toBe('10759|10765')
    expect(p['first_air_date.gte']).toBe('2015-01-01')
    expect(p['with_runtime.lte']).toBeUndefined()
  })
  it('gênero que não existe para séries (terror) é ignorado em séries', () => {
    expect(ai.discoverParams(f({ genres: ['terror'] }), 'tv', [8]).with_genres).toBeUndefined()
  })
  it('kindsFor', () => {
    expect(ai.kindsFor(f({ kind: 'any' }))).toEqual(['movie', 'tv'])
    expect(ai.kindsFor(f({ kind: 'tv' }))).toEqual(['tv'])
  })
})

describe('prompt e schema', () => {
  it('o schema só permite os gêneros e serviços do app', () => {
    const s = ai.responseSchema()
    expect(s.properties.genres.items.enum).toEqual(Object.keys(ai.GENRES))
    expect(s.properties.services.items.enum).toEqual(['Netflix', 'Prime Video', 'HBO Max', 'Crunchyroll'])
    expect(s.required).toContain('off_topic')
  })
  it('a instrução do sistema proíbe citar títulos e manda marcar off_topic em tentativas de mudar as regras', () => {
    expect(ai.SYSTEM_PROMPT).toMatch(/NÃO recomenda nem cita títulos/)
    expect(ai.SYSTEM_PROMPT).toMatch(/off_topic = true/)
  })
})
