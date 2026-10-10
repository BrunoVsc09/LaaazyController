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
  it('grade de 11 colunas: Enter ocupa duas linhas, Espaço seis (ao lado do Shift e do Caps)', () => {
    expect(css).toMatch(/\.osk-keys \{ display: grid; grid-template-columns: repeat\(11, minmax\(0, 1fr\)\);/)
    expect(css).toMatch(/\.osk-key\[data-key="enter"\] \{ grid-row: span 2; \}/)
    expect(css).toMatch(/\.osk-key\[data-key="space"\] \{ grid-column: span 6; \}/)
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

// Pedido do Bruno (2026-10-09): Perfis do controle em preto moderno, estilo Hydra
describe('Perfis do controle: preto, tela inteira', () => {
  it('fundo preto cobrindo a tela (por cima do fundo azul do menu)', () => {
    expect(css).toMatch(/\.pad-view \{ position: fixed; inset: 0;[^}]*background: #0e0e10;/)
  })
  it('o botão escolhido (na lista e no desenho do controle) fica amarelo', () => {
    expect(css).toMatch(/\.pad-row\.sel \{[^}]*outline: 2px solid #ffd23f;/)
    expect(css).toMatch(/\.pad-key\.sel rect, \.pad-key\.sel circle \{[^}]*stroke: #ffd23f;/)
  })
})

describe('Perfis do controle: nada do menu por cima', () => {
  it('o aviso "Controle conectado/não detectado" do menu some nessa tela (ela tem o próprio status)', () => {
    expect(css).toMatch(/\.ps4-screen:has\(\.pad-view\) \.pad-badge \{ display: none; \}/)
  })
})

// Regressão (2026-10-09, achado pelo Bruno: "essa diferença de cor no começo?"): o destaque preso no
// topo tinha uma caixa azul lisa que aparecia sobre o papel de parede mesmo com a página parada
describe('destaque sem caixa de cor diferente', () => {
  it('o destaque não tem fundo próprio', () => {
    expect(css).not.toMatch(/\.lz-hero \{ position: sticky;[^}]*background:/)
  })
  it('a faixa que esconde as fileiras ocupa a tela toda e só aparece quando a página rola', () => {
    expect(css).toMatch(/\.lz-hero::before \{[^}]*left: calc\(50% - 50vw\); right: calc\(50% - 50vw\);[^}]*background: linear-gradient\(180deg, var\(--hero-bg, #0b3f9d\) 0 90%, transparent\);[^}]*animation-timeline: scroll\(root\);/)
  })
})

// Boas-vindas: a foto do perfil aparece no topo, recortada no quadrado do avatar
describe('foto do perfil no topo', () => {
  it('a imagem preenche o avatar sem distorcer', () => {
    expect(css).toMatch(/\.crash-avatar img \{ width: 100%; height: 100%; object-fit: cover; border-radius: inherit; \}/)
  })
})

// Start pausa a prévia (pedido do Bruno, 2026-10-09): o aviso fica sobre o vídeo, no meio
describe('prévia pausada', () => {
  it('aviso "Pausado" centralizado sobre a prévia', () => {
    expect(css).toMatch(/\.lz-paused \{ position: absolute; left: 50%; top: 50%; transform: translate\(-50%, -50%\);/)
  })
})

// Regressão (2026-10-09, pedido do Bruno: melhorar o mouse): uma regra antiga escondia o cursor
// sempre, até no modo mouse. Agora ele só some usando o controle (html.lz-pad).
describe('cursor do mouse', () => {
  it('nenhuma regra esconde o cursor fora do modo controle', () => {
    expect(css).not.toMatch(/\*, \*::before, \*::after \{ cursor: none !important; \}/)
    expect(css).toMatch(/html\.lz-pad, html\.lz-pad \* \{ cursor: none !important; \}/)
  })
  it('as setas das fileiras só aparecem no modo mouse', () => {
    expect(css).toMatch(/html\.lz-pad \.lz-strip-arrow \{ display: none; \}/)
  })
})

// Pedido do Bruno (2026-10-09): a foto no topo sem a moldura laranja (fundo e borda da letra)
describe('foto do perfil no topo sem moldura', () => {
  it('com foto: sem borda e sem o fundo laranja; sem foto, a letra continua igual', () => {
    expect(css).toMatch(/\.crash-avatar:has\(img\) \{ border: 0; background: none;/)
  })
  // "Achei o ícone muito pequeno" (Bruno, 2026-10-09): a foto cresce; a letra sem foto fica como era
  it('com foto: 64 px em tela grande e 54 px em tela média (era 42 e 35)', () => {
    expect(css).toMatch(/\.crash-avatar:has\(img\) \{ border: 0; background: none; width: 64px; height: 64px; \}/)
    expect(css).toMatch(/@media \(max-width: 1400px\) and \(min-width: 761px\) \{ \.crash-avatar:has\(img\) \{ width: 54px; height: 54px; \} \}/)
  })
})

// "Tem como ser redondo o perfil?" (Bruno, 2026-10-09): o avatar do topo é um círculo, como nas
// boas-vindas e nas Configurações (com foto ou com a letra)
describe('avatar do topo redondo', () => {
  it('círculo, e a foto acompanha (border-radius: inherit)', () => {
    expect(css).toMatch(/\.crash-avatar \{ border-radius: 50%; \}/)
    expect(css).toMatch(/\.crash-avatar img \{[^}]*border-radius: inherit;/)
  })
})
