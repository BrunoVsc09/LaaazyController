import { describe, it, expect } from 'vitest'
import THEMES from '../../shared/themes'
import { DEFAULT_THEME, themeOf, nextTheme, hasEffect, themeLabel } from './theme'

// Pedido do Bruno (2026-10-09): cor do Laaazy, com o azul de hoje como padrão
describe('temas de cor', () => {
  it('os quatro temas, na ordem da tela', () => {
    expect(THEMES.map((t) => t.id)).toEqual(['azul', 'preto', 'vermelho', 'moderno'])
    expect(themeLabel('azul')).toBe('Azul com efeito')
    expect(themeLabel('preto')).toBe('Preto com efeito')
    expect(themeLabel('vermelho')).toBe('Preto e vermelho com efeito')
    expect(themeLabel('moderno')).toBe('Preto moderno com azul')
  })
  it('padrão azul; valor salvo estranho volta ao padrão', () => {
    expect(DEFAULT_THEME).toBe('azul')
    expect(themeOf('vermelho')).toBe('vermelho')
    expect(themeOf('rosa')).toBe('azul')
    expect(themeOf(undefined)).toBe('azul')
  })
  it('só o moderno é liso (sem ondas nem partículas)', () => {
    expect(['azul', 'preto', 'vermelho', 'moderno'].map(hasEffect)).toEqual([true, true, true, false])
  })
  it('✕ na linha "Cor do Laaazy" passa para o próximo, dando a volta', () => {
    expect(nextTheme('azul')).toBe('preto')
    expect(nextTheme('moderno')).toBe('azul')
  })
})
