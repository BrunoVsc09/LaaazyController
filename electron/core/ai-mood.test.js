import { describe, it, expect } from 'vitest'
import mood from './ai-mood.js'

const reply = (over = {}) => JSON.stringify({
  mood: 'suspense lento e frio',
  picks: [{ title: 'Dark', year: 2017, kind: 'tv' }, { title: 'Prisoners', year: 2013, kind: 'movie' }],
  ...over,
})

describe('moodSchema', () => {
  it('pede o clima e uma lista de títulos com tipo de lista fechada', () => {
    const s = mood.moodSchema()
    expect(s.required).toEqual(['mood', 'picks'])
    expect(s.properties.picks.items.properties.kind.enum).toEqual(['movie', 'tv'])
  })
})

describe('moodUserText', () => {
  it('monta o pedido com título, tipo, ano e sinopse', () => {
    const t = mood.moodUserText({ title: 'Dark', kind: 'Série', year: '2017', overview: 'Uma criança some.' })
    expect(t).toBe('Dark (Série, 2017)\nSinopse: Uma criança some.')
  })
  it('corta sinopse grande e tira caracteres de controle', () => {
    const t = mood.moodUserText({ title: 'A\u0000B', kind: 'Filme', year: '', overview: 'x'.repeat(2000) })
    expect(t.startsWith('AB (Filme)\nSinopse: ')).toBe(true)
    expect(t.length).toBeLessThan(700)
  })
})

describe('parseMoodResponse', () => {
  it('resposta válida vira clima + títulos', () => {
    expect(mood.parseMoodResponse(reply())).toEqual({
      mood: 'suspense lento e frio',
      picks: [{ title: 'Dark', year: 2017, kind: 'tv' }, { title: 'Prisoners', year: 2013, kind: 'movie' }],
    })
  })
  it('JSON quebrado ou sem títulos: null', () => {
    expect(mood.parseMoodResponse('{x')).toBeNull()
    expect(mood.parseMoodResponse(reply({ picks: [] }))).toBeNull()
    expect(mood.parseMoodResponse('[]')).toBeNull()
  })
  it('descarta itens inválidos, repetidos e passa do limite de 12', () => {
    const picks = [
      { title: 'Dark', year: 2017, kind: 'tv' },
      { title: 'dark', year: 2017, kind: 'tv' }, // repetido
      { title: '', year: 2000, kind: 'movie' }, // sem nome
      { title: 'X', year: 2000, kind: 'game' }, // tipo fora da lista
      ...Array.from({ length: 20 }, (_, i) => ({ title: `T${i}`, year: 'abc', kind: 'movie' })),
    ]
    const r = mood.parseMoodResponse(reply({ picks }))
    expect(r.picks).toHaveLength(12)
    expect(r.picks[0]).toEqual({ title: 'Dark', year: 2017, kind: 'tv' })
    expect(r.picks[1]).toEqual({ title: 'T0', year: null, kind: 'movie' }) // ano inválido vira null
  })
  it('clima é cortado em 60 letras', () => {
    expect(mood.parseMoodResponse(reply({ mood: 'a'.repeat(200) })).mood).toHaveLength(60)
  })
})

describe('matchPick: confere no TMDB o título que a IA citou', () => {
  const results = [
    { id: 1, media_type: 'movie', title: 'Dark', release_date: '2005-01-01', popularity: 9 },
    { id: 2, media_type: 'tv', name: 'Dark', first_air_date: '2017-12-01', popularity: 5 },
    { id: 3, media_type: 'person', name: 'Dark' },
  ]
  it('acha pelo tipo e pelo ano', () => {
    expect(mood.matchPick(results, { title: 'Dark', year: 2017, kind: 'tv' })?.id).toBe('tv:2')
  })
  it('ano com 1 de diferença ainda vale', () => {
    expect(mood.matchPick(results, { title: 'Dark', year: 2018, kind: 'tv' })?.id).toBe('tv:2')
  })
  it('sem ano: o mais popular do mesmo tipo com o mesmo nome', () => {
    expect(mood.matchPick(results, { title: 'dark', year: null, kind: 'movie' })?.id).toBe('movie:1')
  })
  it('nada parecido: null (título inventado não aparece)', () => {
    expect(mood.matchPick(results, { title: 'Dark', year: 1990, kind: 'tv' })).toBeNull()
    expect(mood.matchPick(results, { title: 'Outro Nome', year: null, kind: 'tv' })).toBeNull()
    expect(mood.matchPick([], { title: 'Dark', year: 2017, kind: 'tv' })).toBeNull()
  })
})
