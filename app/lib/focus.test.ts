import { describe, it, expect } from 'vitest'
import { hoverTarget, keepsFocusOnPress } from './focus'

// Elemento falso: closest devolve o que estiver no mapa para o seletor pedido
type Fake = { tagName: string; closest: (sel: string) => Fake | null }
const el = (tagName: string, map: Record<string, Fake | null> = {}): Fake => ({ tagName, closest: (sel) => map[sel] ?? null })
const SEL = '.ps4-screen button'

describe('hoverTarget: o foco (borda) segue o cursor do analógico', () => {
  it('passar por cima de um botão leva o foco para ele', () => {
    const btn = el('BUTTON')
    const span = el('SPAN', { [SEL]: btn })
    expect(hoverTarget(span, el('BUTTON'), SEL)).toBe(btn)
  })
  it('não faz nada se já é o botão com foco', () => {
    const btn = el('BUTTON')
    expect(hoverTarget(el('SPAN', { [SEL]: btn }), btn, SEL)).toBeNull()
  })
  it('passar pelo fundo não tira o foco de ninguém', () => {
    expect(hoverTarget(el('DIV'), el('BUTTON'), SEL)).toBeNull()
  })
  it('não rouba o foco de um campo de texto em uso', () => {
    const btn = el('BUTTON')
    expect(hoverTarget(el('SPAN', { [SEL]: btn }), el('INPUT'), SEL)).toBeNull()
  })
  it('alvo nulo (saiu da janela)', () => {
    expect(hoverTarget(null, el('BUTTON'), SEL)).toBeNull()
  })
})

describe('keepsFocusOnPress: clicar no fundo não apaga a borda', () => {
  it('clique no fundo mantém o foco onde estava', () => {
    expect(keepsFocusOnPress(el('DIV'))).toBe(true)
  })
  it('clique em botão, campo, link ou vídeo segue normal', () => {
    const btn = el('BUTTON')
    expect(keepsFocusOnPress(el('SPAN', { 'button, input, textarea, select, a, label, iframe, [tabindex]': btn }))).toBe(false)
  })
})
