import { describe, it, expect } from 'vitest'
import { trailerEmbedUrl, homeSections, PREVIEW_DELAY_MS } from './trailer'

describe('trailerEmbedUrl', () => {
  it('player do YouTube sem som, sem controles, em loop', () => {
    const u = new URL(trailerEmbedUrl('dQw4w9WgXcQ')!)
    expect(u.origin + u.pathname).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')
    expect(Object.fromEntries(u.searchParams)).toMatchObject({ autoplay: '1', mute: '1', controls: '0', loop: '1', playlist: 'dQw4w9WgXcQ', playsinline: '1' })
  })
  it('chave estranha não vira URL', () => {
    expect(trailerEmbedUrl('../../x')).toBeNull()
    expect(trailerEmbedUrl('')).toBeNull()
    expect(trailerEmbedUrl(null)).toBeNull()
  })
  it('espera um pouco parado no título antes de tocar', () => {
    expect(PREVIEW_DELAY_MS).toBeGreaterThanOrEqual(800)
  })
})

describe('homeSections (ordem do Início)', () => {
  it('filmes e séries logo abaixo do destaque; jogos e apps depois', () => {
    expect(homeSections()).toEqual(['hero', 'titles', 'recent', 'apps'])
  })
})
