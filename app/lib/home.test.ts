import { describe, it, expect } from 'vitest'
import { DEFAULT_PINNED, togglePin, pinnedCards, buildRows, heroInfo, appsGrid, shuffled, similarSource, SIMILAR_MSG } from './home-model'
import { CATALOG } from './catalog'
import type { Title } from './lazy-api'

const t = (id: string, over: Partial<Title> = {}): Title => ({
  id, kind: 'Série', title: id, year: '2024', overview: '', poster: '', backdrop: '', popularity: 1, services: ['Netflix'], ...over,
})

describe('apps fixados no Início', () => {
  it('padrão: os seis streamings', () => {
    expect(DEFAULT_PINNED).toEqual(['Crunchyroll', 'HBO Max', 'Prime Video', 'Netflix', 'YouTube', 'Spotify'])
  })
  it('togglePin fixa no fim e desfixa', () => {
    expect(togglePin(['Netflix'], 'Firefox')).toEqual(['Netflix', 'Firefox'])
    expect(togglePin(['Netflix', 'Firefox'], 'Netflix')).toEqual(['Firefox'])
  })
  it('pinnedCards segue a ordem fixada e ignora nomes que não existem', () => {
    expect(pinnedCards(CATALOG, ['Firefox', 'Fantasma', 'Netflix']).map((c) => c.label)).toEqual(['Firefox', 'Netflix'])
  })
  it('a grade de Apps tem todos os cards menos a Biblioteca (que virou aba)', () => {
    const labels = appsGrid(CATALOG).map((c) => c.label)
    expect(labels).not.toContain('Biblioteca')
    expect(labels).toContain('Perfis do controle') // era "DS4Windows"; o DS4Windows saiu (2026-10-09)
    expect(labels).not.toContain('DS4Windows')
    expect(labels).toHaveLength(CATALOG.length - 1)
  })
})

describe('buildRows', () => {
  it('séries e filmes, sem fileiras vazias', () => {
    const rows = buildRows({ series: [t('a')], films: [] })
    expect(rows.map((r) => r.title)).toEqual(['Séries nos seus apps'])
    expect(rows[0].items).toHaveLength(1)
  })
  it('sem nada, nenhuma fileira', () => {
    expect(buildRows({ series: [], films: [] })).toEqual([])
  })
})

describe('buildRows com Minha lista', () => {
  it('Minha lista vem antes das fileiras em alta', () => {
    const rows = buildRows({ series: [t('a')], films: [t('b', { kind: 'Filme' })], myList: [t('c')] })
    expect(rows.map((r) => r.title)).toEqual(['Minha lista', 'Filmes nos seus apps', 'Séries nos seus apps'])
  })
  it('fileiras separadas: Filmes, Séries e Animes', () => {
    const rows = buildRows({ series: [t('a')], films: [t('b', { kind: 'Filme' })], animes: [t('c')] })
    expect(rows.map((r) => r.id)).toEqual(['films', 'series', 'animes'])
    expect(rows[2].title).toBe('Animes nos seus apps')
  })
})

describe('shuffled: cada vez o Início mostra outros títulos', () => {
  const items = ['a', 'b', 'c', 'd', 'e'].map((id) => t(id))
  it('mesma lista em outra ordem, sem perder nem repetir', () => {
    const r = shuffled(items, () => 0)
    expect(r.map((x) => x.id).sort()).toEqual(['a', 'b', 'c', 'd', 'e'])
    expect(r.map((x) => x.id)).not.toEqual(['a', 'b', 'c', 'd', 'e'])
  })
  it('não mexe na lista original e corta no limite', () => {
    const r = shuffled(items, Math.random, 3)
    expect(r).toHaveLength(3)
    expect(items.map((x) => x.id)).toEqual(['a', 'b', 'c', 'd', 'e'])
  })
})

describe('buildRows com novos episódios', () => {
  it('fileira "Novos episódios" vem primeiro, com o aviso de cada série', () => {
    const rows = buildRows({ series: [], films: [], myList: [t('tv:1'), t('tv:2')], news: [{ id: 'tv:2', label: 'Episódio novo: T1E1' }] })
    expect(rows[0]).toMatchObject({ id: 'news', title: 'Novos episódios', badges: { 'tv:2': 'Episódio novo: T1E1' } })
    expect(rows[0].items.map((x) => x.id)).toEqual(['tv:2'])
  })
})

describe('heroInfo', () => {
  it('monta a linha de detalhes e escolhe o serviço principal', () => {
    expect(heroInfo(t('a', { kind: 'Filme', year: '2023', services: ['Prime Video', 'Netflix'] })))
      .toEqual({ meta: 'Filme · 2023 · Prime Video, Netflix', primary: 'Prime Video' })
  })
  it('sem ano e sem serviço conhecido', () => {
    expect(heroInfo(t('a', { year: '', services: ['Outro'] }))).toEqual({ meta: 'Série · Outro', primary: null })
  })
})

// Regressão (2026-10-08, achado pelo Bruno: "aperto em Parecidos e não acontece nada")
describe('Parecidos (△): de qual título e o que avisar', () => {
  const lists = [[t('a'), t('b')], [t('c')]]
  it('acha o título do card em foco em qualquer fileira', () => {
    expect(similarSource('c', lists)?.id).toBe('c')
  })
  it('foco fora de um título (app, jogo, botão): nenhum', () => {
    expect(similarSource(undefined, lists)).toBeNull()
    expect(similarSource('zzz', lists)).toBeNull()
  })
  it('avisos visíveis no destaque: escolher um título e "procurando" (a IA leva uns segundos)', () => {
    expect(SIMILAR_MSG.pick).toMatch(/filme ou série.*△/)
    expect(SIMILAR_MSG.searching('Duna')).toMatch(/Duna.*segundos/)
  })
})
