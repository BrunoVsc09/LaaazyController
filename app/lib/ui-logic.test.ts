import { describe, it, expect } from 'vitest'
import { initialScreen, screenReducer, showsTabs, tabStep } from './screen-state'
import { visibleGames } from './library-filter'
import { CATALOG } from './catalog'
import streaming from '../../shared/streaming'
import DS4_KEYS from '../../shared/ds4-keys'

describe('screenReducer', () => {
  it('boas-vindas abre como tela própria e sair dela vai ao Início', () => {
    const s = screenReducer(initialScreen, { type: 'open', screen: 'welcome' })
    expect(s).toEqual({ screen: 'welcome', anim: 'none' })
    expect(screenReducer(s, { type: 'leave' })).toEqual({ screen: 'home', anim: 'none' })
  })
  it('começa no Início', () => {
    expect(initialScreen).toEqual({ screen: 'home', anim: 'none' })
  })
  it('Biblioteca entra e sai com animação', () => {
    let s = screenReducer(initialScreen, { type: 'open', screen: 'library' })
    expect(s).toMatchObject({ screen: 'library', anim: 'entering' })
    s = screenReducer(s, { type: 'animDone' })
    expect(s.anim).toBe('none')
    s = screenReducer(s, { type: 'leave' })
    expect(s).toMatchObject({ screen: 'library', anim: 'leaving' })
    s = screenReducer(s, { type: 'animDone' })
    expect(s).toMatchObject({ screen: 'home', anim: 'none' })
  })
  it('outras telas (Apps, Perfis, Configurações) abrem e fecham sem animação', () => {
    for (const screen of ['apps', 'ds4', 'settings'] as const) {
      let s = screenReducer(initialScreen, { type: 'open', screen })
      expect(s).toMatchObject({ screen, anim: 'none' })
      s = screenReducer(s, { type: 'leave' })
      expect(s.screen).toBe('home')
    }
  })
  it('goHome (botão PS) fecha qualquer tela na hora', () => {
    expect(screenReducer({ screen: 'library', anim: 'leaving' }, { type: 'goHome' })).toEqual({ screen: 'home', anim: 'none' })
  })
  it('leave no Início não faz nada', () => {
    expect(screenReducer(initialScreen, { type: 'leave' })).toEqual(initialScreen)
  })
})

describe('visibleGames', () => {
  const games = [
    { id: '1', name: 'Portal', platform: 'Steam' },
    { id: '2', name: 'Fortnite', platform: 'Epic Games' },
    { id: '3', name: 'portal 2', platform: 'Meu PC' },
  ]
  it('Todos e sem busca: tudo', () => {
    expect(visibleGames(games, { platform: 'Todos', query: '' })).toHaveLength(3)
  })
  it('filtra por plataforma e por nome sem diferenciar maiúsculas', () => {
    expect(visibleGames(games, { platform: 'Steam', query: '' }).map((g) => g.id)).toEqual(['1'])
    expect(visibleGames(games, { platform: 'Todos', query: 'PORTAL' }).map((g) => g.id)).toEqual(['1', '3'])
  })
})

describe('CATALOG', () => {
  it('cards de streaming usam as URLs do catálogo compartilhado', () => {
    for (const s of streaming) {
      expect(CATALOG.find((c) => c.label === s.label)?.url).toBe(s.url)
    }
  })
  it('todo card com perfil DS4 existe no catálogo', () => {
    for (const k of DS4_KEYS.filter((k: string) => !['menu', 'games', 'desktop', 'keyboard'].includes(k))) {
      expect(CATALOG.some((c) => c.label === k), k).toBe(true)
    }
  })
})

// Pedido do Bruno (2026-10-09): R1 anda para a direita nas abas e L1 volta
describe('L1/R1 nas abas', () => {
  it('Início → Biblioteca → Apps → Buscar, e de volta', () => {
    expect(tabStep('home', 1)).toBe('library')
    expect(tabStep('library', 1)).toBe('apps')
    expect(tabStep('apps', 1)).toBe('search')
    expect(tabStep('search', -1)).toBe('apps')
    expect(tabStep('library', -1)).toBe('home')
  })
  it('nas pontas não dá a volta; fora das abas não faz nada', () => {
    expect(tabStep('search', 1)).toBeNull()
    expect(tabStep('home', -1)).toBeNull()
    expect(tabStep('settings', 1)).toBeNull()
    expect(tabStep('welcome', -1)).toBeNull()
  })
})

// Mouse (pedido do Bruno, 2026-10-09): as abas também aparecem em Buscar, para sair dela com um clique
describe('showsTabs', () => {
  it('Início, Biblioteca, Apps e Buscar mostram as abas', () => {
    for (const s of ['home', 'library', 'apps', 'search'] as const) expect(showsTabs(s)).toBe(true)
  })
  it('Configurações, Perfis do controle e boas-vindas não', () => {
    for (const s of ['settings', 'ds4', 'welcome'] as const) expect(showsTabs(s)).toBe(false)
  })
})
