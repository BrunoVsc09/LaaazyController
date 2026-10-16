import { describe, it, expect } from 'vitest'
import { SETTINGS_SECTIONS, nextSection, pathStatus } from './settings-menu'

// "As configurações são muito sujas" (outro usuário, 2026-10-10): categorias à esquerda, uma por vez
describe('categorias das Configurações', () => {
  it('na ordem: do que se mexe mais ao técnico (Avançado por último)', () => {
    expect(SETTINGS_SECTIONS.map((s) => s.label)).toEqual(['Perfil', 'Aparência', 'Controle e mouse', 'Streaming', 'Contas e chaves', 'Sistema', 'Avançado'])
  })
  it('cada uma tem uma linha curta dizendo o que tem dentro', () => {
    for (const s of SETTINGS_SECTIONS) expect(s.hint.length).toBeGreaterThan(10)
  })
  it('L1/R1: anterior/seguinte, dando a volta', () => {
    expect(nextSection('perfil', 1)).toBe('aparencia')
    expect(nextSection('perfil', -1)).toBe('avancado')
    expect(nextSection('avancado', 1)).toBe('perfil')
  })
})

describe('pathStatus: caminho do programa sem poluir a tela', () => {
  // Na tela sempre apareceu "✓ Encontrado" (o valor era desenhado da direita para a esquerda); agora
  // o texto é esse mesmo, na ordem certa
  it('achou: só "✓ Encontrado" (o caminho completo fica no Avançado)', () => {
    expect(pathStatus('C:\Program Files\Edge\msedge.exe')).toBe('✓ Encontrado')
  })
  it('não achou: diz o que fazer', () => {
    expect(pathStatus('')).toBe('Não encontrado: toque para escolher')
  })
})
