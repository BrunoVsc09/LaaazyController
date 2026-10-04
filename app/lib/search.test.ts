import { describe, it, expect } from 'vitest'
import { normalize, searchLocal } from './search'
import { CATALOG } from './catalog'

const games = [
  { id: '1', name: 'Ação Total', platform: 'Steam' },
  { id: '2', name: 'Celeste', platform: 'Epic Games' },
]

describe('normalize', () => {
  it('minúsculas e sem acento', () => {
    expect(normalize('  AÇÃO Évora ')).toBe('acao evora')
  })
})

describe('searchLocal', () => {
  it('acha apps e jogos ignorando acentos e maiúsculas', () => {
    const r = searchLocal('acao', { cards: CATALOG, games })
    expect(r.games.map((g) => g.id)).toEqual(['1'])
    expect(searchLocal('NETF', { cards: CATALOG, games }).apps.map((c) => c.label)).toEqual(['Netflix'])
  })
  it('a Biblioteca (aba) não aparece como app', () => {
    expect(searchLocal('biblio', { cards: CATALOG, games }).apps).toEqual([])
  })
  it('busca com menos de 2 letras não mostra nada', () => {
    expect(searchLocal('a', { cards: CATALOG, games })).toEqual({ apps: [], games: [] })
    expect(searchLocal('  ', { cards: CATALOG, games })).toEqual({ apps: [], games: [] })
  })
})
