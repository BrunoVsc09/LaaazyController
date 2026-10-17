import { describe, it, expect } from 'vitest'
import { homePreview, nextScreenScale, scaleAttr, screenScaleLabel, screenScaleMsg, zoomFor } from './screen-scale'

// "O tamanho de tudo ser customizável e com ilustração de como ficaria" (Bruno, 2026-10-16)
describe('tamanho do Laaazy', () => {
  it('Normal → Grande → Maior → Cama, em volta', () => {
    expect(nextScreenScale(100)).toBe(125)
    expect(nextScreenScale(150)).toBe(175)
    expect(nextScreenScale(175)).toBe(100)
    expect(nextScreenScale(999)).toBe(100)
  })
  it('rótulo e aviso', () => {
    expect(screenScaleLabel(100)).toBe('Normal')
    expect(screenScaleLabel(175)).toBe('Cama (175%)')
    expect(screenScaleLabel(125)).toBe('Grande (125%)')
    expect(screenScaleMsg(150)).toBe('O Laaazy inteiro em 150%: letras, botões e capas maiores, para ler de longe.')
    expect(screenScaleMsg(100)).toBe('O Laaazy no tamanho normal.')
  })
  it('zoom da página: 1 no normal; valor fora da lista também vira 1', () => {
    expect(zoomFor(100)).toBe('1')
    expect(zoomFor(150)).toBe('1.5')
    expect(zoomFor(999)).toBe('1')
  })
  it('marca no <html> (data-lz-scale) para o Início se reorganizar em Maior e Cama', () => {
    expect(scaleAttr(175)).toBe('175')
    expect(scaleAttr(100)).toBe('100')
    expect(scaleAttr(999)).toBe('100')
  })
})

// A telinha de exemplo mostra uma miniatura do Início na mesma proporção da tela (medidas em % da altura)
describe('exemplo do tamanho do Laaazy: miniatura do Início', () => {
  it('no Normal, as medidas do Início de hoje em 1920x1080', () => {
    const p = homePreview(100)
    expect(p.header).toBeCloseTo(8.9, 1) // topo de 96 px
    expect(p.title).toBeCloseTo(4.3, 1) // título do destaque de 46 px
    expect(p.text).toBeCloseTo(1.6, 1) // texto do destaque de ~17 px
    expect(p.cards).toBe(6)
  })
  it('maior: as letras crescem junto; os cards ficam quase do mesmo tamanho (cabem 5 na fileira)', () => {
    const p = homePreview(150)
    expect(p.title).toBeCloseTo(homePreview(100).title * 1.5, 5)
    expect(homePreview(125).cards).toBe(5)
    expect(p.cards).toBe(5)
    expect(homePreview(175).cards).toBe(5)
  })
})
