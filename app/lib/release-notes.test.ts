import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { notesHeading, notesDate, sectionIcon, footerAvatars, NOTES_WAIT_S, continueLabel } from './release-notes'

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

// "É mais fácil um timer de 6 segundos para apertar continuar" (Bruno, 2026-10-14; antes era rolar até o fim)
describe('novidades: espera antes de continuar', () => {
  it('6 segundos', () => {
    expect(NOTES_WAIT_S).toBe(6)
  })
  it('o botão mostra quanto falta e depois só "Continuar"', () => {
    expect(continueLabel(6)).toBe('Continuar (6)')
    expect(continueLabel(1)).toBe('Continuar (1)')
    expect(continueLabel(0)).toBe('Continuar')
  })
})

// "Novos avatares :D — mostre todos eles em um rodapé" (Bruno, 2026-10-14)
describe('novidades: avatares no rodapé', () => {
  it('todos os avatares que vêm com o Laaazy, menos o logo (avatar-01)', () => {
    const all = ['avatar-01', 'avatar-02', 'avatar-05'].map((id) => ({ id, src: `avatars/${id}.webp` }))
    expect(footerAvatars(all).map((a) => a.id)).toEqual(['avatar-02', 'avatar-05'])
  })
})

// Regressão (teste ao vivo em 1280x600, 2026-10-14): a lista crescia além da janela, que cortava o topo
// (título e 1º destaque sumiam) e não rolava; aí "chegou ao fim" valia na hora e o Entendi já liberava
describe('novidades: janela em tela pequena', () => {
  const css = fs.readFileSync(path.join(__dirname, '..', 'release-notes.css'), 'utf8')
  it('o corpo da janela tem altura limitada', () => {
    expect(css).toMatch(/\.lz-notes-body \{[^}]*max-height: 90vh;/)
  })
  // "Queria que a tela fosse grande, ficou estranho rodar pra baixo" (Bruno, 2026-10-14): a janela ocupa
  // quase a tela toda, para caber tudo sem rolar numa TV
  it('janela grande: até 1500 px de largura e 90% da altura', () => {
    expect(css).toMatch(/\.lz-notes \{[^}]*width: min\(1500px, 94vw\);[^}]*max-height: 90vh;/)
  })
  it('a lista ocupa o que sobra e rola por dentro', () => {
    expect(css).toMatch(/\.lz-notes-list \{[^}]*flex: 1 1 auto;[^}]*overflow-y: auto;/)
  })
})
