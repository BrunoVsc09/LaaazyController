import { describe, it, expect } from 'vitest'
import mod from './pad-profile.js'

const { BUTTONS, describeProfile, setButton, validAction, parseProfile } = mod

// Como o PC.json que vem com o Laaazy-pad (JSON com comentários)
const PC = `// Computador: o controle vira mouse, com os atalhos do Laaazy.
{
  "versao": 1,
  "botoes": {
    "Cruz":     { "clique": "esquerdo" },
    "PS":       { "tecla": "Ctrl+Alt+Home" },  // volta ao Início do Laaazy
    "Share":    { "tecla": "Ctrl+Alt+K" },     // teclado por cima
    "L2":       { "tecla": "Ctrl+Alt+Down" },
    "R2":       { "tecla": "Ctrl+Alt+Up" },
    "R1":       { "clique": "avancar" }
  },
  "analogicos": {
    "esquerdo": { "mouse":   { "velocidade": 1200, "zonaMorta": 0.15 } },
    "direito":  { "rolagem": { "eixo": "vertical", "velocidade": 8, "zonaMorta": 0.2 } }
  },
  "touchpad": { "mouse": { "velocidade": 1.0 } }
}`
const JOGOS = `{ "versao": 1, "botoes": { "PS": { "tecla": "Ctrl+Alt+Home" } }, "touchpad": { "mouse": { "velocidade": 1.0 } } }`

describe('perfil do Laaazy-pad: ler', () => {
  it('lê JSON com comentários (// e /* */), sem confundir // dentro de texto', () => {
    expect(parseProfile('/* a */ { "x": "http://a" } // b')).toEqual({ x: 'http://a' })
    expect(parseProfile('{ quebrado')).toBeNull()
  })
  it('lista todos os botões do controle, com o que cada um faz', () => {
    const d = describeProfile(PC, 'PC')
    expect(d.buttons.map((b) => b.id)).toEqual(BUTTONS.map((b) => b.id))
    expect(d.buttons.find((b) => b.id === 'Cruz')).toMatchObject({ label: '✕', action: { clique: 'esquerdo' }, locked: false })
    expect(d.buttons.find((b) => b.id === 'Quadrado')).toMatchObject({ action: null }) // nada
  })
  it('analógicos e touchpad aparecem, só para ler', () => {
    expect(describeProfile(PC, 'PC').sticks).toEqual({ esquerdo: 'Mover o mouse', direito: 'Rolagem', touchpad: 'Mover o mouse' })
    expect(describeProfile(JOGOS, 'Jogos').sticks).toEqual({ esquerdo: 'Nada (o jogo lê)', direito: 'Nada (o jogo lê)', touchpad: 'Mover o mouse' })
  })
})

// Pedido do Bruno (2026-10-09): personalizar sem tirar os comandos de que o Laaazy depende
describe('comandos fixos do Laaazy', () => {
  it('PS (voltar ao Início) é fixo nos dois perfis', () => {
    expect(describeProfile(JOGOS, 'Jogos').buttons.find((b) => b.id === 'PS').locked).toBe(true)
    expect(describeProfile(PC, 'PC').buttons.find((b) => b.id === 'PS').locked).toBe(true)
  })
  it('no PC, Share (teclado por cima) e L2/R2 (volume) também são fixos', () => {
    const pc = describeProfile(PC, 'pc').buttons // o nome não diferencia maiúsculas, como no Laaazy-pad
    for (const id of ['Share', 'L2', 'R2']) expect(pc.find((b) => b.id === id).locked, id).toBe(true)
    const jogos = describeProfile(JOGOS, 'Jogos').buttons
    for (const id of ['Share', 'L2', 'R2']) expect(jogos.find((b) => b.id === id).locked, id).toBe(false)
  })
  it('não deixa mudar um fixo', () => {
    expect(setButton(PC, 'PC', 'PS', { clique: 'esquerdo' })).toEqual({ ok: false, msg: 'PS é um comando fixo do Laaazy e não pode mudar.' })
    expect(setButton(PC, 'PC', 'Share', null).ok).toBe(false)
  })
})

describe('ações aceitas (as mesmas do Laaazy-pad)', () => {
  it('tecla: modificadores (Ctrl, Alt, Shift, Win) e uma tecla no fim', () => {
    for (const t of ['Enter', 'Ctrl+Alt+Home', 'Alt+Tab', 'Win+D', 'Ctrl+Shift+Esc', 'F11', '5', 'VolumeMute']) expect(validAction({ tecla: t }), t).toBe(true)
    for (const t of ['', 'Ctrl', 'Home+Ctrl', 'Ctrl+Ctrl+A', 'Banana', 'Ctrl++A']) expect(validAction({ tecla: t }), t).toBe(false)
  })
  it('clique: esquerdo, direito, meio, voltar ou avancar; nada = null', () => {
    for (const c of ['esquerdo', 'direito', 'meio', 'voltar', 'avancar']) expect(validAction({ clique: c })).toBe(true)
    expect(validAction({ clique: 'lateral' })).toBe(false)
    expect(validAction(null)).toBe(true)
    expect(validAction({ tecla: 'A', clique: 'meio' })).toBe(false)
    expect(validAction({ mouse: 'x' })).toBe(false)
  })
})

describe('mudar um botão', () => {
  it('muda só o botão pedido e mantém o resto do perfil', () => {
    const r = setButton(PC, 'PC', 'R1', { tecla: 'Alt+Right' })
    expect(r.ok).toBe(true)
    const novo = parseProfile(r.text)
    expect(novo.botoes.R1).toEqual({ tecla: 'Alt+Right' })
    expect(novo.botoes.PS).toEqual({ tecla: 'Ctrl+Alt+Home' })
    expect(novo.analogicos).toEqual(parseProfile(PC).analogicos)
    expect(novo.touchpad).toEqual({ mouse: { velocidade: 1.0 } })
    expect(novo.versao).toBe(1)
  })
  it('nada: o botão sai do perfil (o programa da frente lê o controle direto)', () => {
    const novo = parseProfile(setButton(PC, 'PC', 'Cruz', null).text)
    expect(novo.botoes).not.toHaveProperty('Cruz')
  })
  it('botão desconhecido, ação inválida ou arquivo quebrado: não muda nada', () => {
    expect(setButton(PC, 'PC', 'Turbo', null)).toMatchObject({ ok: false })
    expect(setButton(PC, 'PC', 'R1', { tecla: 'Banana' })).toEqual({ ok: false, msg: 'Atalho inválido: Banana.' })
    expect(setButton('{ quebrado', 'PC', 'R1', null)).toMatchObject({ ok: false })
  })
})
