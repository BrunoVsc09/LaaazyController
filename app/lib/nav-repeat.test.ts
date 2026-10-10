import { describe, it, expect } from 'vitest'
import { repeatDelay } from './nav-repeat'

// "Facilite a navegação do Início com o analógico, deixe mais fluido" (Bruno, 2026-10-10):
// antes andava um card a cada 0,22 s fixo (toque rápido dava passo duplo; fileira longa era lenta)
describe('repeatDelay: quanto esperar antes do próximo passo, segurando a direção', () => {
  // "Lento, demora a andar" (Bruno, 2026-10-10): tudo um pouco mais rápido que a 1ª versão (330/170/110)
  it('depois do 1º passo espera mais (um toque anda um card só)', () => {
    expect(repeatDelay(1)).toBe(260)
  })
  it('depois acelera, até um passo a cada 0,085 s', () => {
    expect(repeatDelay(2)).toBe(140)
    expect(repeatDelay(3)).toBe(140)
    expect(repeatDelay(4)).toBe(85)
    expect(repeatDelay(40)).toBe(85)
  })
})
