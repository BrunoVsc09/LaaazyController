import { describe, it, expect } from 'vitest'
import { createInputMode } from './input-mode'

describe('createInputMode: controle e mouse sem brigar', () => {
  it('começa no modo controle (cursor escondido)', () => {
    expect(createInputMode().mode()).toBe('pad')
  })
  it('mouse parado não conta: a tela rolar embaixo do cursor não rouba o foco', () => {
    const m = createInputMode()
    expect(m.mouseMoved(500, 300)).toBe(false) // 1º evento só marca onde o cursor está
    expect(m.mouseMoved(500, 300)).toBe(false) // mesmo lugar (evento gerado pela rolagem)
    expect(m.mouseMoved(502, 301)).toBe(false) // tremidinha de 1–2 px
    expect(m.mode()).toBe('pad')
  })
  it('mexer o mouse de verdade (≥ 4 px) passa para o modo mouse', () => {
    const m = createInputMode()
    m.mouseMoved(500, 300)
    expect(m.mouseMoved(510, 300)).toBe(true)
    expect(m.mode()).toBe('mouse')
  })
  it('usar o controle (ou as setas) volta para o modo controle e o cursor parado é ignorado de novo', () => {
    let t = 0
    const m = createInputMode(() => t)
    m.mouseMoved(500, 300); m.mouseMoved(510, 300)
    t = 1000
    m.padUsed()
    expect(m.mode()).toBe('pad')
    expect(m.mouseMoved(510, 300)).toBe(false)
    expect(m.mouseMoved(530, 300)).toBe(true)
  })
  it('analógico que mexe o mouse e também aparece como controle: não fica piscando entre os modos', () => {
    let t = 0
    const m = createInputMode(() => t)
    m.mouseMoved(500, 300); m.mouseMoved(520, 300) // mouse andou em t=0
    t = 100; m.padUsed()
    expect(m.mode()).toBe('mouse') // sinal do controle logo depois do mouse não troca
    t = 400; m.padUsed()
    expect(m.mode()).toBe('pad') // controle sozinho depois de um tempo troca
  })
})
