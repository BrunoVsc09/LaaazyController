import { describe, it, expect } from 'vitest'
import { OSK_ROWS, KEY_PAD, applyKey, OSK_HINTS, maskValue, splitAtCaret, createOskPad } from './osk'
import gamepad from '../../shared/gamepad'

const { BTN } = gamepad

describe('teclado na tela: layout', () => {
  it('tem números, letras (com ç) e as teclas especiais', () => {
    const all = OSK_ROWS.flat()
    for (const k of ['1', '0', 'q', 'p', 'a', 'ç', 'z', 'm', 'shift', 'space', 'backspace', 'clear', 'enter', 'left', 'right', 'caps']) expect(all).toContain(k)
  })
  // Pedido do Bruno (2026-10-08), como no teclado do Hydra: cada tecla mostra o botão que faz o mesmo
  it('as teclas com atalho mostram o botão do controle', () => {
    expect(KEY_PAD).toEqual({ backspace: '□', space: '△', enter: 'R2', left: 'L1', right: 'R1', caps: 'L2' })
  })
})

describe('applyKey', () => {
  const s = (value: string, caret = value.length, shift = false, caps = false) => ({ value, caret, shift, caps })
  it('letra entra no cursor e o cursor anda; o site recebe só a letra', () => {
    expect(applyKey(s('ab'), 'c')).toEqual({ value: 'abc', caret: 3, shift: false, caps: false, done: false, edit: { text: 'c' } })
    expect(applyKey(s('ac', 1), 'b')).toMatchObject({ value: 'abc', caret: 2 })
  })
  it('shift deixa a próxima letra maiúscula e depois desliga', () => {
    const on = applyKey(s('a'), 'shift')
    expect(on).toMatchObject({ value: 'a', shift: true, edit: null })
    expect(applyKey(on, 'b')).toMatchObject({ value: 'aB', shift: false, edit: { text: 'B' } })
  })
  // Pedido do Bruno (2026-10-08): L2 é o Caps Lock, maiúsculas até desligar
  it('Caps Lock: todas as letras maiúsculas até desligar; Shift com Caps dá minúscula', () => {
    const on = applyKey(s('a'), 'caps')
    expect(on).toMatchObject({ caps: true, edit: null })
    const ab = applyKey(applyKey(on, 'b'), 'c')
    expect(ab).toMatchObject({ value: 'aBC', caps: true })
    expect(applyKey(applyKey(ab, 'shift'), 'd')).toMatchObject({ value: 'aBCd', caps: true, shift: false })
    expect(applyKey(ab, 'caps')).toMatchObject({ caps: false })
    expect(applyKey(applyKey(ab, 'caps'), 'e').value).toBe('aBCe')
  })
  it('espaço entra no cursor', () => {
    expect(applyKey(s('ab'), 'space')).toMatchObject({ value: 'ab ', edit: { text: ' ' } })
  })
  it('apagar tira a letra antes do cursor', () => {
    expect(applyKey(s('abc', 2), 'backspace')).toMatchObject({ value: 'ac', caret: 1, edit: { back: 1 } })
    expect(applyKey(s('abc', 0), 'backspace')).toMatchObject({ value: 'abc', caret: 0, edit: null })
  })
  it('L1/R1: o cursor anda para trás e para a frente, sem passar das pontas', () => {
    expect(applyKey(s('abc'), 'left')).toMatchObject({ caret: 2, edit: { move: -1 } })
    expect(applyKey(s('abc', 2), 'right')).toMatchObject({ caret: 3, edit: { move: 1 } })
    expect(applyKey(s('abc', 0), 'left')).toMatchObject({ caret: 0, edit: null })
    expect(applyKey(s('abc'), 'right')).toMatchObject({ caret: 3, edit: null })
  })
  it('limpar: no site, vai ao fim e apaga tudo', () => {
    expect(applyKey(s('naruto', 2), 'clear')).toMatchObject({ value: '', caret: 0, edit: { move: 4, back: 6 } })
    expect(applyKey(s('abc'), 'clear').edit).toEqual({ back: 3 })
    expect(applyKey(s(''), 'clear').edit).toBeNull()
  })
  it('Enter (R2) termina sem mudar o texto e aperta Enter no site', () => {
    expect(applyKey(s('abc'), 'enter')).toMatchObject({ value: 'abc', done: true, edit: { enter: true } })
  })
  it('limite de 200 caracteres', () => {
    const full = applyKey(s('x'.repeat(200)), 'a')
    expect(full.value).toHaveLength(200)
    expect(full.edit).toBeNull()
  })
})

describe('maskValue e splitAtCaret', () => {
  it('campo de senha mostra bolinhas', () => {
    expect(maskValue('abc', true)).toBe('•••')
    expect(maskValue('abc', false)).toBe('abc')
  })
  it('separa o texto em volta do cursor (para desenhar a barrinha)', () => {
    expect(splitAtCaret('abcd', 1, false)).toEqual(['a', 'bcd'])
    expect(splitAtCaret('abcd', 1, true)).toEqual(['•', '•••'])
  })
})

describe('controle no teclado: □ apaga, △ espaço, L1/R1 cursor, R2 Enter, L2 Caps Lock', () => {
  const frame = (down: number[]) => ({ fired: (b: number) => down.includes(b), down: (b: number) => down.includes(b) })
  it('cada botão aperta a tecla certa', () => {
    const pad = createOskPad()
    expect(pad(frame([BTN.SQUARE]), 0)).toEqual(['backspace'])
    const pad2 = createOskPad()
    expect(pad2(frame([BTN.TRIANGLE, BTN.L1, BTN.R1, BTN.R2, BTN.L2]), 0)).toEqual(['space', 'enter', 'caps', 'left', 'right'])
  })
  it('segurar o □ vai apagando (depois de um instante, várias vezes por segundo)', () => {
    const pad = createOskPad()
    const held = { fired: () => false, down: (b: number) => b === BTN.SQUARE }
    expect(pad(frame([BTN.SQUARE]), 0)).toEqual(['backspace'])
    expect(pad(held, 200)).toEqual([]) // ainda não: um toque não pode apagar duas
    let count = 0
    for (let t = 400; t <= 1000; t += 16) count += pad(held, t).length
    expect(count).toBeGreaterThanOrEqual(8)
    expect(pad({ fired: () => false, down: () => false }, 1016)).toEqual([]) // soltou, parou
  })
  it('△ e R2 não repetem segurando', () => {
    const pad = createOskPad()
    pad(frame([BTN.TRIANGLE]), 0)
    const held = { fired: () => false, down: (b: number) => b === BTN.TRIANGLE }
    let count = 0
    for (let t = 16; t <= 2000; t += 16) count += pad(held, t).length
    expect(count).toBe(0)
  })
})

describe('OSK_HINTS', () => {
  it('Digitar (X), Apagar (□), Espaço (△), Fechar (O)', () => {
    expect(OSK_HINTS.map((h) => [h.label, h.button])).toEqual([
      ['Digitar', BTN.X], ['Apagar', BTN.SQUARE], ['Espaço', BTN.TRIANGLE], ['Fechar', BTN.O],
    ])
  })
})
