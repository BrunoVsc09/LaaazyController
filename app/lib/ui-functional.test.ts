import { describe, it, expect } from 'vitest'
import { formatClock, displayUser } from './header-info'
import { visibleGames, nextSort } from './library-filter'
import { hintsFor } from './footer-hints'
import { nextZone } from './home-zone'
import gamepad from '../../shared/gamepad'

describe('formatClock', () => {
  it('24h com dois dígitos', () => {
    expect(formatClock(new Date(2026, 9, 4, 9, 5))).toBe('09:05')
    expect(formatClock(new Date(2026, 9, 4, 23, 59))).toBe('23:59')
  })
})

describe('displayUser', () => {
  it('nome do Windows e inicial maiúscula', () => {
    expect(displayUser('ana')).toEqual({ name: 'ana', initial: 'A' })
  })
  it('sem nome: nada para mostrar', () => {
    expect(displayUser('')).toEqual({ name: '', initial: '' })
  })
})

describe('ordenação da biblioteca', () => {
  const games = [
    { id: '1', name: 'Celeste', platform: 'Steam' },
    { id: '2', name: 'ábaco', platform: 'Steam' },
    { id: '3', name: 'Zelda', platform: 'Meu PC' },
  ]
  it('A→Z e Z→A, com acentos na ordem do português', () => {
    expect(visibleGames(games, { platform: 'Todos', query: '', sort: 'asc' }).map((g) => g.name)).toEqual(['ábaco', 'Celeste', 'Zelda'])
    expect(visibleGames(games, { platform: 'Todos', query: '', sort: 'desc' }).map((g) => g.name)).toEqual(['Zelda', 'Celeste', 'ábaco'])
  })
  it('nextSort alterna', () => {
    expect(nextSort('asc')).toBe('desc')
    expect(nextSort('desc')).toBe('asc')
  })
})

describe('hintsFor (rodapé só com comandos reais)', () => {
  const labels = (s: Parameters<typeof hintsFor>[0]) => hintsFor(s).map((h) => h.label)
  it('menu: só Confirmar', () => {
    expect(labels('home')).toEqual(['Confirmar'])
  })
  it('Biblioteca: Confirmar, Voltar e Buscar (□)', () => {
    expect(labels('library')).toEqual(['Confirmar', 'Voltar', 'Buscar'])
    expect(hintsFor('library').find((h) => h.label === 'Buscar')?.button).toBe(gamepad.BTN.SQUARE)
  })
  it('Perfis e Configurações: Confirmar e Voltar', () => {
    expect(labels('ds4')).toEqual(['Confirmar', 'Voltar'])
    expect(labels('settings')).toEqual(['Confirmar', 'Voltar'])
  })
  it('nenhuma tela mostra "Detalhes"', () => {
    for (const s of ['home', 'library', 'ds4', 'settings'] as const) expect(labels(s)).not.toContain('Detalhes')
  })
})

describe('nextZone (menu: cards ↔ cabeçalho)', () => {
  it('↑ nos cards sobe para o cabeçalho; ↓ no cabeçalho desce para os cards', () => {
    expect(nextZone('tiles', -1)).toBe('header')
    expect(nextZone('header', 1)).toBe('tiles')
  })
  it('sem movimento vertical, fica', () => {
    expect(nextZone('tiles', 0)).toBe('tiles')
    expect(nextZone('header', -1)).toBe('header')
    expect(nextZone('tiles', 1)).toBe('tiles')
  })
})
