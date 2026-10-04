import { describe, it, expect } from 'vitest'
import mod from './youtube.js'

describe('refererFor (identificação exigida pelo player do YouTube)', () => {
  it('player embutido recebe a identificação do app', () => {
    expect(mod.refererFor('https://www.youtube-nocookie.com/embed/abc?autoplay=1')).toBe('https://com.bruno.laaazy/')
    expect(mod.refererFor('https://www.youtube.com/embed/abc')).toBe('https://com.bruno.laaazy/')
  })
  it('outros endereços ficam como estão', () => {
    expect(mod.refererFor('https://www.youtube.com/watch?v=abc')).toBeNull()
    expect(mod.refererFor('https://evil.com/www.youtube-nocookie.com/embed/x')).toBeNull()
    expect(mod.refererFor('não é url')).toBeNull()
  })
  it('lista de endereços para o filtro do Electron', () => {
    expect(mod.EMBED_URLS).toEqual(['https://www.youtube-nocookie.com/embed/*', 'https://www.youtube.com/embed/*'])
  })
})
