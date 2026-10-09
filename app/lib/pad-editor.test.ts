import { describe, it, expect } from 'vitest'
import { padButtonAt, shortcutFromKey, actionLabel, COMMON_KEYS, CLICK_OPTIONS, nextProfile } from './pad-editor'

// Editor de perfis (pedido do Bruno, 2026-10-09): personalizar sem tirar os comandos fixos
describe('qual botão do controle foi apertado (Gamepad API padrão → nome no Laaazy-pad)', () => {
  it('face, gatilhos, sticks, Share/Options, D-pad, PS e touchpad', () => {
    const want: [number, string][] = [[0, 'Cruz'], [1, 'Circulo'], [2, 'Quadrado'], [3, 'Triangulo'], [4, 'L1'], [5, 'R1'], [6, 'L2'], [7, 'R2'],
      [8, 'Share'], [9, 'Options'], [10, 'L3'], [11, 'R3'], [12, 'DpadCima'], [13, 'DpadBaixo'], [14, 'DpadEsquerda'], [15, 'DpadDireita'], [16, 'PS'], [17, 'Touchpad']]
    for (const [i, id] of want) expect(padButtonAt(i), id).toBe(id)
    expect(padButtonAt(30)).toBeNull()
  })
})

describe('gravar atalho pelo teclado', () => {
  const k = (key: string, code: string, mods: Partial<Record<'ctrlKey' | 'altKey' | 'shiftKey' | 'metaKey', boolean>> = {}) =>
    ({ key, code, ctrlKey: false, altKey: false, shiftKey: false, metaKey: false, ...mods })
  it('modificadores na ordem do Laaazy-pad e a tecla no fim', () => {
    expect(shortcutFromKey(k('k', 'KeyK', { ctrlKey: true, altKey: true }))).toBe('Ctrl+Alt+K')
    expect(shortcutFromKey(k('Tab', 'Tab', { altKey: true }))).toBe('Alt+Tab')
    expect(shortcutFromKey(k('d', 'KeyD', { metaKey: true }))).toBe('Win+D')
    expect(shortcutFromKey(k('!', 'Digit1', { shiftKey: true }))).toBe('Shift+1')
  })
  it('nomes das teclas como o Laaazy-pad espera', () => {
    expect(shortcutFromKey(k('ArrowRight', 'ArrowRight', { altKey: true }))).toBe('Alt+Right')
    expect(shortcutFromKey(k('Escape', 'Escape'))).toBe('Esc')
    expect(shortcutFromKey(k(' ', 'Space'))).toBe('Space')
    expect(shortcutFromKey(k('F11', 'F11'))).toBe('F11')
    expect(shortcutFromKey(k('PageDown', 'PageDown'))).toBe('PageDown')
    expect(shortcutFromKey(k('AudioVolumeMute', 'AudioVolumeMute'))).toBe('VolumeMute')
  })
  it('só modificador apertado (ainda gravando) ou tecla que o Laaazy-pad não conhece: nada', () => {
    expect(shortcutFromKey(k('Control', 'ControlLeft', { ctrlKey: true }))).toBeNull()
    expect(shortcutFromKey(k('ç', 'Semicolon'))).toBeNull()
  })
})

describe('o que aparece para cada ação', () => {
  it('nomes amigáveis para os atalhos do Laaazy; o resto como está', () => {
    expect(actionLabel({ tecla: 'Ctrl+Alt+Home' })).toBe('Voltar ao Início')
    expect(actionLabel({ tecla: 'Ctrl+Alt+K' })).toBe('Teclado por cima')
    expect(actionLabel({ tecla: 'Ctrl+Alt+Down' })).toBe('Volume −')
    expect(actionLabel({ tecla: 'Ctrl+Alt+Up' })).toBe('Volume +')
    expect(actionLabel({ tecla: 'Alt+Tab' })).toBe('Tecla Alt+Tab')
  })
  it('cliques e nada', () => {
    expect(actionLabel({ clique: 'esquerdo' })).toBe('Clique esquerdo')
    expect(actionLabel({ clique: 'voltar' })).toBe('Mouse: voltar')
    expect(actionLabel({ clique: 'avancar' })).toBe('Mouse: avançar')
    expect(actionLabel(null)).toBe('Nada')
  })
  it('opções de clique e atalhos comuns (para quem só tem o controle)', () => {
    expect(CLICK_OPTIONS.map((c) => c.value)).toEqual(['esquerdo', 'direito', 'meio', 'voltar', 'avancar'])
    expect(COMMON_KEYS).toEqual(expect.arrayContaining(['Enter', 'Esc', 'Space', 'Tab', 'F11', 'Alt+Tab']))
  })
})

describe('L1/R1 trocam o perfil em edição', () => {
  it('anda em volta da lista', () => {
    expect(nextProfile(['Jogos', 'PC'], 'Jogos', 1)).toBe('PC')
    expect(nextProfile(['Jogos', 'PC'], 'PC', 1)).toBe('Jogos')
    expect(nextProfile(['Jogos', 'PC'], 'Jogos', -1)).toBe('PC')
    expect(nextProfile([], 'PC', 1)).toBe('PC')
  })
})
