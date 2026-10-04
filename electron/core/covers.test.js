import { describe, it, expect } from 'vitest'
import mod from './covers.js'

const DAY = 24 * 3600 * 1000

describe('covers (regras)', () => {
  const games = [
    { id: 'steam:1', name: 'Portal', cover: 'https://steam/1.jpg' },
    { id: 'epic:Fortnite', name: 'Fortnite' },
    { id: 'pc:c:\\jogos\\hades.exe', name: 'Hades' },
  ]
  it('applyCovers põe a capa guardada nos jogos sem capa, sem trocar a da Steam', () => {
    const cache = { 'epic:Fortnite': { url: 'https://sgdb/f.png', at: 0 }, 'steam:1': { url: 'https://outra', at: 0 } }
    const r = mod.applyCovers(games, cache)
    expect(r.map((g) => g.cover)).toEqual(['https://steam/1.jpg', 'https://sgdb/f.png', undefined])
  })
  it('toLookup: só jogos sem capa e sem resposta recente, com limite', () => {
    const now = 100 * DAY
    const cache = { 'epic:Fortnite': { url: null, at: now - 1 * DAY } } // "não achou" há 1 dia: não tenta de novo
    expect(mod.toLookup(games, cache, now).map((g) => g.id)).toEqual(['pc:c:\\jogos\\hades.exe'])
    const old = { 'epic:Fortnite': { url: null, at: now - 8 * DAY } } // há 8 dias: tenta de novo
    expect(mod.toLookup(games, old, now).map((g) => g.id)).toEqual(['epic:Fortnite', 'pc:c:\\jogos\\hades.exe'])
    const many = Array.from({ length: 30 }, (_, i) => ({ id: `pc:${i}`, name: `J${i}` }))
    expect(mod.toLookup(many, {}, now)).toHaveLength(10)
  })
  it('pickGrid escolhe a primeira imagem', () => {
    expect(mod.pickGrid([{ url: 'a' }, { url: 'b' }])).toBe('a')
    expect(mod.pickGrid([])).toBeNull()
    expect(mod.pickGrid(undefined)).toBeNull()
  })
})
