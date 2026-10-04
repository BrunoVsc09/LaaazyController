import { describe, it, expect } from 'vitest'
import { OSK_ROWS, applyKey, OSK_HINTS, maskValue } from './osk'
import gamepad from '../../shared/gamepad'

describe('teclado na tela: layout', () => {
  it('tem números, letras (com ç) e as teclas especiais', () => {
    const all = OSK_ROWS.flat()
    for (const k of ['1', '0', 'q', 'p', 'a', 'ç', 'z', 'm', 'shift', 'space', 'backspace', 'clear', 'done']) expect(all).toContain(k)
  })
})

describe('applyKey', () => {
  const s = (value: string, shift = false) => ({ value, shift })
  it('letra entra no fim', () => {
    expect(applyKey(s('ab'), 'c')).toEqual({ value: 'abc', shift: false, done: false })
  })
  it('shift deixa a próxima letra maiúscula e depois desliga', () => {
    const on = applyKey(s('a'), 'shift')
    expect(on).toEqual({ value: 'a', shift: true, done: false })
    expect(applyKey(on, 'b')).toEqual({ value: 'aB', shift: false, done: false })
  })
  it('espaço, apagar e limpar', () => {
    expect(applyKey(s('ab'), 'space').value).toBe('ab ')
    expect(applyKey(s('ab'), 'backspace').value).toBe('a')
    expect(applyKey(s(''), 'backspace').value).toBe('')
    expect(applyKey(s('abc'), 'clear').value).toBe('')
  })
  it('pronto termina sem mudar o texto', () => {
    expect(applyKey(s('abc'), 'done')).toEqual({ value: 'abc', shift: false, done: true })
  })
  it('limite de 200 caracteres', () => {
    expect(applyKey(s('x'.repeat(200)), 'a').value).toHaveLength(200)
  })
})

describe('maskValue', () => {
  it('campo de senha mostra bolinhas', () => {
    expect(maskValue('abc', true)).toBe('•••')
    expect(maskValue('abc', false)).toBe('abc')
  })
})

describe('OSK_HINTS', () => {
  it('Digitar (X), Apagar (□), Espaço (△), Fechar (O)', () => {
    const { BTN } = gamepad
    expect(OSK_HINTS.map((h) => [h.label, h.button])).toEqual([
      ['Digitar', BTN.X], ['Apagar', BTN.SQUARE], ['Espaço', BTN.TRIANGLE], ['Fechar', BTN.O],
    ])
  })
})
