import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const css = fs.readFileSync(path.join(__dirname, '..', 'globals.css'), 'utf8')

// Regressão: o anel de foco usava :focus-visible, que o Chrome esconde depois que o mouse
// (ou o controle no perfil PC do DS4Windows) é usado. Aí a borda sumia e não dava para ver onde estava.
describe('anel de foco', () => {
  it('existe uma regra de foco que vale sempre (:focus), em todas as telas e janelas do app', () => {
    expect(css).toMatch(/:is\(\.ps4-screen, \.kb-overlay\) :is\(button, input, a, \[tabindex\]\):focus \{[^}]*outline: 3px solid #ffd23f/)
  })
  it('nenhuma regra apaga o contorno de algo focado', () => {
    expect(css).not.toMatch(/:focus(-visible)? \{ outline: none; \}/)
  })
})

// Barras de rolagem do Windows apareciam na Biblioteca (horizontal e vertical) e empurravam o rodapé
describe('sem barras de rolagem', () => {
  it('nenhuma barra de rolagem visível no app', () => {
    expect(css).toMatch(/html, body, :is\(\.ps4-screen, \.kb-overlay\) \* \{ scrollbar-width: none; \}/)
    expect(css).toMatch(/::-webkit-scrollbar \{ display: none; width: 0; height: 0; \}/)
  })
  it('a grade da Biblioteca não rola para o lado', () => {
    expect(css).toMatch(/\.library-grid \{ overflow-x: hidden; overflow-y: auto;/)
  })
  it('o rodapé fica preso no fim da janela (não sobe junto com a rolagem)', () => {
    expect(css).toMatch(/\.ps4-footer \{ position: fixed;/)
  })
})

// O trailer ficava no topo e sumia ao descer para Séries/Animes; o rodapé fixo cobria a última fileira
describe('Início: destaque com trailer sempre à vista', () => {
  it('o destaque fica preso no topo enquanto as fileiras rolam por baixo', () => {
    expect(css).toMatch(/\.lz-hero \{ position: sticky; top: 0;[^}]*height: var\(--lz-hero-h\)/)
  })
  it('a tela não vira caixa de rolagem própria (senão o sticky não funciona): overflow-x clip', () => {
    expect(css).toMatch(/\.ps4-screen \{ overflow-x: clip; overflow-y: visible; \}/)
  })
  it('o card em foco para abaixo do destaque e acima do rodapé', () => {
    expect(css).toMatch(/html:has\(\.lz-home\) \{ scroll-padding-top: calc\(var\(--lz-hero-h\) \+ 16px\); scroll-padding-bottom: 120px; \}/)
  })
})
