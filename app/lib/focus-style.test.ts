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
  // Pedido do Bruno (2026-10-08): prévia maior. Cresce com a tela (46% da altura), entre 380 e 520px
  it('o destaque (e a prévia dentro dele) cresce com a altura da tela', () => {
    expect(css).toMatch(/:root \{ --lz-hero-h: clamp\(380px, 46vh, 520px\); \}/)
  })
  it('o card em foco para abaixo do destaque e acima do rodapé', () => {
    expect(css).toMatch(/html:has\(\.lz-home\) \{ scroll-padding-top: calc\(var\(--lz-hero-h\) \+ 16px\); scroll-padding-bottom: 120px; \}/)
  })
})

describe('cursor no modo controle', () => {
  it('usando o controle o cursor some; mexendo o mouse ele volta (classe no <html>)', () => {
    expect(css).toMatch(/html\.lz-pad, html\.lz-pad \* \{ cursor: none !important; \}/)
  })
})

// Regressão (2026-10-08, achado pelo Bruno): o teclado por cima não pode pegar o foco do Windows
// (a busca do site fecha quando o Edge perde o foco). Sem foco, :focus não é desenhado; a tecla
// atual é marcada com data-current e ganha a borda pelo CSS.
describe('teclado por cima sem foco: borda na tecla atual', () => {
  it('a tecla marcada com data-current tem a borda amarela', () => {
    expect(css).toMatch(/\.kb-overlay button\[data-current\] \{ outline: 3px solid #ffd23f;/)
  })
})

// Pedido do Bruno (2026-10-08), com o teclado do Hydra de referência: preto e letras grandes,
// para ler do sofá; Enter alto à direita e Espaço largo embaixo
describe('teclado na tela: preto e letras grandes', () => {
  it('fundo preto e letras de 34px', () => {
    expect(css).toMatch(/\.osk \{[^}]*background: #0b0b0c;/)
    expect(css).toMatch(/\.osk-key \{[^}]*font-size: 34px;/)
  })
  it('grade de 11 colunas: Enter ocupa duas linhas, Espaço sete colunas', () => {
    expect(css).toMatch(/\.osk-keys \{ display: grid; grid-template-columns: repeat\(11, minmax\(0, 1fr\)\);/)
    expect(css).toMatch(/\.osk-key\[data-key="enter"\] \{ grid-row: span 2; \}/)
    expect(css).toMatch(/\.osk-key\[data-key="space"\] \{ grid-column: span 7; \}/)
  })
  it('o teclado por cima também é preto', () => {
    expect(css).toMatch(/\.kb-overlay \{[^}]*background: #000;/)
  })
})

// Numa TV com escala de 125%/150% a janela do teclado por cima fica mais baixa: as teclas encolhem
// para caber, em vez de o Enter e o Espaço sumirem embaixo
describe('teclado por cima cabe na janela', () => {
  it('as linhas dividem a altura da janela', () => {
    expect(css).toMatch(/\.kb-overlay \{ height: 100vh;[^}]*overflow: hidden;/)
    expect(css).toMatch(/\.kb-overlay \.osk-keys \{ flex: 1; min-height: 0; grid-auto-rows: minmax\(0, 1fr\); \}/)
  })
})
