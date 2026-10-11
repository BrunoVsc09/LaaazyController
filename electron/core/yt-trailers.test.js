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

describe('mergeTrailers: oficial em português do TMDB, depois o do YouTube, depois os outros do TMDB', () => {
  it('junta e corta em 6, sem repetir', () => {
    const fromYt = [{ key: 'a', lang: 'pt', label: 'dublado' }]
    const fromTmdb = [{ key: 'a', lang: 'pt' }, { key: 'b', lang: 'en' }, ...Array.from({ length: 8 }, (_, i) => ({ key: `t${i}`, lang: 'en' }))]
    const out = yt.mergeTrailers(fromYt, fromTmdb)
    expect(out.map((x) => x.key)).toEqual(['a', 'b', 't0', 't1', 't2', 't3'])
    expect(out[0].label).toBe('dublado')
  })
  // Trailer errado (Bruno, 2026-10-10): o achado no YouTube passava na frente do oficial do TMDB
  it('o oficial em português do TMDB (ligado ao título pelo cadastro) vem antes do achado no YouTube', () => {
    const fromYt = [{ key: 'yt', lang: 'pt', label: 'legendado' }]
    const fromTmdb = [{ key: 'oficial', lang: 'pt' }, { key: 'en', lang: 'en' }]
    expect(yt.mergeTrailers(fromYt, fromTmdb).map((x) => x.key)).toEqual(['oficial', 'yt', 'en'])
  })
})

// Trailer de outro filme (Bruno, 2026-10-10): o título do vídeo só precisava CONTER o nome
describe('rankYoutube: vídeo de outro filme da mesma franquia fica de fora', () => {
  const rank = (results, item) => yt.rankYoutube(results, item).map((x) => x.key)
  it('Naruto Shippuden: "Road to Ninja" é outro filme', () => {
    const item = { title: 'Naruto Shippuden', year: '2007' }
    expect(rank([r('filme', 'Naruto Shippuden Road to Ninja Trailer - Legendado')], item)).toEqual([])
    expect(rank([r('serie', 'Naruto Shippuden | Trailer Oficial Dublado'), r('temp', 'Naruto Shippuden Temporada 2 Trailer Legendado HD')], item)).toEqual(['serie', 'temp'])
  })
  it('Homem-Aranha: "Sem Volta Para Casa" é outro filme', () => {
    const item = { title: 'Homem-Aranha', year: '2002' }
    expect(rank([r('outro', 'Homem-Aranha: Sem Volta Para Casa | Trailer Oficial Dublado')], item)).toEqual([])
    expect(rank([r('certo', 'Homem-Aranha (2002) - Trailer Dublado')], item)).toEqual(['certo'])
  })
  it('ano no nome do vídeo precisa ser o do título', () => {
    const item = { title: 'Homem-Aranha', year: '2002' }
    expect(rank([r('remake', 'Homem-Aranha 2017 trailer dublado')], item)).toEqual([])
  })
  it('nome do canal ou do streaming no título do vídeo continua valendo', () => {
    const item = { title: 'Dark', year: '2017' }
    expect(rank([r('nf', 'Dark | Trailer oficial dublado | Netflix Brasil'), r('t2', 'Dark: 2ª Temporada | Teaser Dublado | Netflix')], item)).toEqual(['nf', 't2'])
  })
})
