import { describe, it, expect } from 'vitest'
import { currentOutputName, pickerRows, outputBadge, DEVICE_SELECTOR_HINT } from './audio-outputs'

const XDG = { id: 'a', name: 'Fones de ouvido (XDG-342)', isDefault: true, preferred: true }
const PC = { id: 'b', name: 'Alto-falantes (High Definition Audio Device)', isDefault: false, preferred: false }

describe('saída de som (tela)', () => {
  it('a linha mostra a saída em uso agora', () => {
    expect(currentOutputName({ ok: true, items: [PC, XDG], hidden: 0 })).toBe('Fones de ouvido (XDG-342)')
  })
  it('antes de carregar ou sem conseguir ler: diz o que está acontecendo', () => {
    expect(currentOutputName(null)).toBe('Carregando...')
    expect(currentOutputName({ ok: false, items: [], hidden: 0 })).toBe('Indisponível')
  })
  it('marcas: em uso e preferida', () => {
    expect(outputBadge(XDG)).toBe('● em uso · ★ preferida')
    expect(outputBadge(PC)).toBe('')
    expect(outputBadge({ ...PC, preferred: true })).toBe('★ preferida')
  })
  it('lista curta: as saídas e, no fim, "Mostrar todas" com quantas estão escondidas', () => {
    const rows = pickerRows({ ok: true, items: [PC, XDG], hidden: 10 }, false)
    expect(rows.map((r) => r.label)).toEqual([PC.name, XDG.name, 'Mostrar todas (10 escondidas)'])
    expect(rows[2].kind).toBe('toggle')
  })
  it('com todas abertas: volta para a lista curta', () => {
    const rows = pickerRows({ ok: true, items: [PC, XDG], hidden: 0 }, true)
    expect(rows.at(-1)).toMatchObject({ kind: 'toggle', label: 'Mostrar só as principais' })
  })
  it('nada escondido e lista curta: sem botão extra', () => {
    expect(pickerRows({ ok: true, items: [PC], hidden: 0 }, false).map((r) => r.kind)).toEqual(['output'])
  })
  it('lembra que o equalizador só vale nas saídas marcadas no Device Selector', () => {
    expect(DEVICE_SELECTOR_HINT).toMatch(/Device Selector/)
  })
})
