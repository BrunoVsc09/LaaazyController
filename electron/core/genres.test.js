import { describe, it, expect } from 'vitest'
import mod from './genres.js'

describe('GENRES (gêneros do app → ids do TMDB)', () => {
  it('18 gêneros; filmes e séries têm ids diferentes; null quando não existe', () => {
    expect(Object.keys(mod.GENRES)).toHaveLength(18)
    expect(mod.GENRES.ficcao_cientifica).toEqual({ movie: 878, tv: 10765 })
    expect(mod.GENRES.terror).toEqual({ movie: 27, tv: null })
    expect(mod.GENRES.reality).toEqual({ movie: null, tv: 10764 })
  })
})
