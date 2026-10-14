import { describe, it, expect } from 'vitest'
import { notesHeading, notesDate, sectionIcon } from './release-notes'

describe('novidades da versão (tela)', () => {
  it('título com a versão', () => {
    expect(notesHeading('3.6.6')).toBe('Novidades da versão 3.6.6')
  })
  it('data no jeito brasileiro', () => {
    expect(notesDate('2026-10-14')).toBe('14/10/2026')
    expect(notesDate('qualquer')).toBe('')
  })
  it('um ícone para cada parte do CHANGELOG', () => {
    expect([sectionIcon('Novo'), sectionIcon('Mudou'), sectionIcon('Corrigido'), sectionIcon('Outra')]).toEqual(['✨', '🔧', '🩹', '•'])
  })
})
