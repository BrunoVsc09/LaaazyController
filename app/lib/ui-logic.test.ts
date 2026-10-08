import { describe, it, expect } from 'vitest'
import { initialScreen, screenReducer } from './screen-state'
import { visibleGames } from './library-filter'
import { CATALOG } from './catalog'
import streaming from '../../shared/streaming'
import DS4_KEYS from '../../shared/ds4-keys'

describe('screenReducer', () => {
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
