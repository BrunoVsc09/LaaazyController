import { describe, it, expect } from 'vitest'
import mod from './recent.js'

describe('recent', () => {
  it('pushRecent põe na frente, sem repetir, com limite', () => {
    expect(mod.pushRecent(['a', 'b'], 'b')).toEqual(['b', 'a'])
    expect(mod.pushRecent(['a'], 'c')).toEqual(['c', 'a'])
    expect(mod.pushRecent(Array.from({ length: 10 }, (_, i) => String(i)), 'x')).toHaveLength(10)
  })
  it('recentGames segue a ordem dos recentes e some com jogos que saíram da lista', () => {
    const games = [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }]
    expect(mod.recentGames(['b', 'sumiu', 'a'], games).map((g) => g.id)).toEqual(['b', 'a'])
  })
})
