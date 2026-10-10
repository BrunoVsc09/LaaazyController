import { describe, it, expect } from 'vitest'
import { repeatDelay } from './nav-repeat'

// "Facilite a navegação do Início com o analógico, deixe mais fluido" (Bruno, 2026-10-10):
// antes andava um card a cada 0,22 s fixo (toque rápido dava passo duplo; fileira longa era lenta)
describe('repeatDelay: quanto esperar antes do próximo passo, segurando a direção', () => {
  it('depois do 1º passo espera mais (um toque anda um card só)', () => {
    expect(repeatDelay(1)).toBe(330)
  })
  it('depois acelera, até um passo a cada 0,11 s', () => {
    expect(repeatDelay(2)).toBe(170)
    expect(repeatDelay(4)).toBe(170)
    expect(repeatDelay(5)).toBe(110)
    expect(repeatDelay(40)).toBe(110)
  })
})
