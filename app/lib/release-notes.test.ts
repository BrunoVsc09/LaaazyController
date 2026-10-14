import { describe, it, expect } from 'vitest'
import { notesHeading, notesDate, sectionIcon, reachedEnd, footerAvatars } from './release-notes'

describe('novidades da versão (tela)', () => {
  it('título com a versão', () => {
    expect(notesHeading('3.6.6')).toBe('Novidades da versão 3.6.6')
  })
  it('data no jeito brasileiro', () => {
    expect(notesDate('2026-10-14')).toBe('14/10/2026')
    expect(notesDate('qualquer')).toBe('')
  })
  it('um ícone para cada parte do CHANGELOG', () => {
    expect([sectionIcon('Destaques'), sectionIcon('Novo'), sectionIcon('Mudou'), sectionIcon('Corrigido'), sectionIcon('Outra')]).toEqual(['⭐', '✨', '🔧', '🩹', '•'])
  })
})

// "Só depois de chegar no final a tela pode fechar" (Bruno, 2026-10-14)
describe('novidades: chegou ao fim?', () => {
  it('rolou até o fundo (com folga de alguns pixels): sim', () => {
    expect(reachedEnd({ scrollTop: 600, clientHeight: 400, scrollHeight: 1000 })).toBe(true)
    expect(reachedEnd({ scrollTop: 597, clientHeight: 400, scrollHeight: 1000 })).toBe(true)
  })
  it('ainda tem conteúdo embaixo: não', () => {
    expect(reachedEnd({ scrollTop: 0, clientHeight: 400, scrollHeight: 1000 })).toBe(false)
    expect(reachedEnd({ scrollTop: 590, clientHeight: 400, scrollHeight: 1000 })).toBe(false)
  })
  it('tudo coube sem rolar: já está no fim', () => {
    expect(reachedEnd({ scrollTop: 0, clientHeight: 400, scrollHeight: 400 })).toBe(true)
  })
})

// "Novos avatares :D — mostre todos eles em um rodapé" (Bruno, 2026-10-14)
describe('novidades: avatares no rodapé', () => {
  it('todos os avatares que vêm com o Laaazy, menos o logo (avatar-01)', () => {
    const all = ['avatar-01', 'avatar-02', 'avatar-05'].map((id) => ({ id, src: `avatars/${id}.webp` }))
    expect(footerAvatars(all).map((a) => a.id)).toEqual(['avatar-02', 'avatar-05'])
  })
})
