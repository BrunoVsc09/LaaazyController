import { describe, it, expect } from 'vitest'
import { initialScreen, screenReducer } from './screen-state'
import { visibleGames } from './library-filter'
import { CATALOG } from './catalog'
import streaming from '../../shared/streaming'
import DS4_KEYS from '../../shared/ds4-keys'

describe('screenReducer', () => {
  it('começa no menu com o primeiro card', () => {
    expect(initialScreen).toEqual({ screen: 'home', selected: 0, anim: 'none' })
  })
  it('move entre os cards sem passar das pontas', () => {
    let s = screenReducer(initialScreen, { type: 'move', dir: -1, count: 3 })
    expect(s.selected).toBe(0)
    s = screenReducer(s, { type: 'move', dir: 1, count: 3 })
    s = screenReducer(s, { type: 'move', dir: 1, count: 3 })
    s = screenReducer(s, { type: 'move', dir: 1, count: 3 })
    expect(s.selected).toBe(2)
  })
  // B5: as setas mudavam o card selecionado mesmo com a Biblioteca aberta
  it('B5: com outra tela aberta, mover não muda o card do menu', () => {
    const lib = screenReducer({ ...initialScreen, selected: 1 }, { type: 'open', screen: 'library' })
    expect(screenReducer(lib, { type: 'move', dir: 1, count: 5 }).selected).toBe(1)
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
  it('outras telas abrem e fecham sem animação', () => {
    let s = screenReducer(initialScreen, { type: 'open', screen: 'ds4' })
    expect(s).toMatchObject({ screen: 'ds4', anim: 'none' })
    s = screenReducer(s, { type: 'leave' })
    expect(s.screen).toBe('home')
  })
  it('goHome (botão PS) fecha qualquer tela na hora', () => {
    const s = screenReducer({ screen: 'library', selected: 2, anim: 'leaving' }, { type: 'goHome' })
    expect(s).toEqual({ screen: 'home', selected: 2, anim: 'none' })
  })
  it('select escolhe um card', () => {
    expect(screenReducer(initialScreen, { type: 'select', index: 3 }).selected).toBe(3)
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
    for (const k of DS4_KEYS.filter((k: string) => k !== 'menu')) {
      expect(CATALOG.some((c) => c.label === k), k).toBe(true)
    }
  })
})
