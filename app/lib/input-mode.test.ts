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
  it('analógico só navega se o mouse estiver parado há 1 s e o analógico ficar inclinado por 80 ms', () => {
    let t = 0
    const m = createInputMode(() => t)
    expect(m.stickAllowed(true)).toBe(false) // acabou de inclinar
    t = 50
    expect(m.stickAllowed(true)).toBe(false)
    t = 90
    expect(m.stickAllowed(true)).toBe(true)
    expect(m.stickAllowed(false)).toBe(false) // soltou
    // perfil PC: o mesmo analógico move o cursor -> não navega
    m.mouseMoved(500, 300); t = 200; m.mouseMoved(540, 300)
    t = 400; m.stickAllowed(true); t = 600
    expect(m.stickAllowed(true)).toBe(false)
    t = 1300 // mouse parado há mais de 1 s
    expect(m.stickAllowed(true)).toBe(true)
  })
  it('perfil PC (X = clique do mouse): no modo controle só o X do controle clica; no modo mouse só o mouse', () => {
    let t = 0
    const m = createInputMode(() => t)
    expect(m.padClicks()).toBe(true) // modo controle: X aperta o item com a borda
    expect(m.mouseButtonsWork()).toBe(false) // o clique que o perfil PC gera é ignorado
    m.mouseMoved(500, 300); t = 50; m.mouseMoved(540, 300)
    expect(m.padClicks()).toBe(false) // modo mouse: o clique do mouse já faz o trabalho
    expect(m.mouseButtonsWork()).toBe(true)
  })
})

