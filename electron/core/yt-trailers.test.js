import { describe, it, expect } from 'vitest'
import yt from './yt-trailers.js'

// Formato de um resultado do YouTube Data API v3 (search.list)
const r = (id, title, channel = 'Qualquer Canal') => ({ id: { kind: 'youtube#video', videoId: id }, snippet: { title, channelTitle: channel } })

describe('searchQuery', () => {
  it('título, ano e o que queremos (dublado ou legendado)', () => {
    expect(yt.searchQuery({ title: 'Duna: Parte Dois', year: '2024' })).toBe('Duna: Parte Dois 2024 trailer dublado legendado')
    expect(yt.searchQuery({ title: 'Dark', year: '' })).toBe('Dark trailer dublado legendado')
  })
  it('sem título: nada a buscar', () => {
    expect(yt.searchQuery({ title: '  ', year: '2020' })).toBe('')
  })
})

describe('rankYoutube: escolhe trailers em português entre os resultados', () => {
  const item = { title: 'Duna: Parte Dois', year: '2024' }
  it('dublado antes de legendado; canal oficial do Brasil ganha de canal qualquer', () => {
    const list = rankYoutube([
      r('leg1', 'Duna: Parte Dois | Trailer Oficial Legendado'),
      r('dub1', 'DUNA: PARTE DOIS - Trailer Dublado', 'Fã Clube'),
      r('dub2', 'Duna: Parte Dois | Trailer Oficial Dublado', 'Warner Bros. Pictures Brasil'),
    ])
    expect(list.map((x) => x.key)).toEqual(['dub2', 'dub1', 'leg1'])
    expect(list[0]).toEqual({ key: 'dub2', lang: 'pt', label: 'dublado' })
    expect(list[2].label).toBe('legendado')
  })
  it('descarta vídeos de outro título, reações, análises e sem "trailer"', () => {
    const list = rankYoutube([
      r('outro', 'Duna (2021) Trailer Dublado'), // nome do título não bate por inteiro
      r('react', 'REAGINDO ao trailer dublado de Duna: Parte Dois'),
      r('analise', 'Duna: Parte Dois trailer dublado - análise e explicado'),
      r('cena', 'Duna: Parte Dois cena dublada'),
      r('ok', 'Duna Parte Dois – trailer dublado'), // pontuação diferente ainda vale
    ])
    expect(list.map((x) => x.key)).toEqual(['ok'])
  })
  it('sem "dublado" nem "legendado": fica de fora (o TMDB já dá os em inglês)', () => {
    expect(rankYoutube([r('en', 'Dune: Part Two | Official Trailer')])).toEqual([])
  })
  it('id de vídeo inválido ou resultado que não é vídeo: ignora', () => {
    expect(rankYoutube([{ id: { kind: 'youtube#channel', channelId: 'x' }, snippet: { title: 'Duna: Parte Dois trailer dublado' } },
      r('../x', 'Duna: Parte Dois trailer dublado')])).toEqual([])
  })
  it('no máximo 3', () => {
    const many = Array.from({ length: 6 }, (_, i) => r(`v${i}aaaaaa`, `Duna: Parte Dois trailer dublado ${i}`))
    expect(rankYoutube(many)).toHaveLength(3)
  })
  function rankYoutube(results) { return yt.rankYoutube(results, item) }
})

describe('mergeTrailers: YouTube em português primeiro, depois os do TMDB, sem repetir', () => {
  it('junta e corta em 6', () => {
    const fromYt = [{ key: 'a', lang: 'pt', label: 'dublado' }]
    const fromTmdb = [{ key: 'a', lang: 'pt' }, { key: 'b', lang: 'en' }, ...Array.from({ length: 8 }, (_, i) => ({ key: `t${i}`, lang: 'en' }))]
    const out = yt.mergeTrailers(fromYt, fromTmdb)
    expect(out.map((x) => x.key)).toEqual(['a', 'b', 't0', 't1', 't2', 't3'])
    expect(out[0].label).toBe('dublado')
  })
})
