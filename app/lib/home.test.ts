import { describe, it, expect } from 'vitest'
import { DEFAULT_PINNED, togglePin, pinnedCards, buildRows, heroInfo, appsGrid } from './home-model'
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
    expect(labels).toContain('DS4Windows')
    expect(labels).toHaveLength(CATALOG.length - 1)
  })
})

describe('buildRows', () => {
  it('séries e filmes em alta, sem fileiras vazias', () => {
    const rows = buildRows({ series: [t('a')], films: [] })
    expect(rows.map((r) => r.title)).toEqual(['Séries em alta nos seus apps'])
    expect(rows[0].items).toHaveLength(1)
  })
  it('sem nada, nenhuma fileira', () => {
    expect(buildRows({ series: [], films: [] })).toEqual([])
  })
})

describe('buildRows com Minha lista', () => {
  it('Minha lista vem antes das fileiras em alta', () => {
    const rows = buildRows({ series: [t('a')], films: [t('b', { kind: 'Filme' })], myList: [t('c')] })
    expect(rows.map((r) => r.title)).toEqual(['Minha lista', 'Séries em alta nos seus apps', 'Filmes em alta nos seus apps'])
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
