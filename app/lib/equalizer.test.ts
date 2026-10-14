import { describe, it, expect } from 'vitest'
import {
  FLAT, applyPreset, stepBand, stepEffect, nextPreset, presetLabel, dbText, curvePoints, statusText, INSTALL_WAIT,
} from './equalizer'

describe('equalizador (tela): presets', () => {
  it('aplicar um preset copia as bandas e os efeitos, sem desligar nada', () => {
    const s = applyPreset({ ...FLAT, on: false }, 'jogos')
    expect(s).toEqual({ on: false, preset: 'jogos', bands: [2, 1, -1, 0, 0, 1, 3, 3, 2, 1], bass: 2, clarity: 3 })
  })
  it('X no preset anda pela lista e volta ao começo; "Personalizado" volta para o primeiro', () => {
    expect(nextPreset('geral')).toBe('musica')
    expect(nextPreset('voz')).toBe('bass-boost')
    expect(nextPreset('bass-boost')).toBe('geral')
    expect(nextPreset('personalizado')).toBe('geral')
  })
  // Pedido do Bruno (2026-10-14): preset só de grave forte
  it('Bass Boost: graves das bandas e o efeito Bass Boost, sem mexer no resto', () => {
    const s = applyPreset(FLAT, 'bass-boost')
    expect(s.bands).toEqual([3, 3, 2, 0, 0, 0, 0, 0, 0, 0])
    expect(s.bass).toBe(5)
    expect(s.clarity).toBe(0)
    expect(presetLabel('bass-boost')).toBe('Bass Boost')
  })
  it('nome de cada preset', () => {
    expect(presetLabel('musica')).toBe('Música')
    expect(presetLabel('personalizado')).toBe('Personalizado')
  })
})

describe('equalizador (tela): ajustar', () => {
  it('↑/↓ numa banda muda 1 dB e vira "Personalizado"', () => {
    const s = stepBand(FLAT, 3, 1)
    expect(s.bands).toEqual([0, 0, 0, 1, 0, 0, 0, 0, 0, 0])
    expect(s.preset).toBe('personalizado')
  })
  it('a banda para em ±12 dB (segurar ↑ não passa do limite)', () => {
    let s = FLAT
    for (let i = 0; i < 20; i++) s = stepBand(s, 0, 1)
    expect(s.bands[0]).toBe(12)
    for (let i = 0; i < 40; i++) s = stepBand(s, 0, -1)
    expect(s.bands[0]).toBe(-12)
  })
  it('no limite, não muda nada (nem o preset)', () => {
    const top = { ...FLAT, preset: 'geral', bands: [12, 0, 0, 0, 0, 0, 0, 0, 0, 0] }
    expect(stepBand(top, 0, 1)).toBe(top)
  })
  it('Bass Boost e Clarity vão de 0 a 10', () => {
    expect(stepEffect(FLAT, 'bass', 1)).toMatchObject({ bass: 1, preset: 'personalizado' })
    expect(stepEffect(FLAT, 'clarity', -1)).toBe(FLAT)
    expect(stepEffect({ ...FLAT, clarity: 10 }, 'clarity', 1).clarity).toBe(10)
  })
  it('não mexe no estado anterior (a tela compara antes e depois)', () => {
    const before = { ...FLAT, bands: [...FLAT.bands] }
    stepBand(before, 2, 1)
    expect(before.bands[2]).toBe(0)
  })
})

describe('equalizador (tela): textos e gráfico', () => {
  it('dB com sinal; zero sem sinal', () => {
    expect([dbText(2), dbText(0), dbText(-1)]).toEqual(['+2', '0', '-1'])
  })
  it('curva: bandas espalhadas na largura; 0 dB no meio da altura, +12 em cima, -12 embaixo', () => {
    const pts = curvePoints([12, 0, 0, 0, 0, 0, 0, 0, 0, -12], 900, 240)
    expect(pts).toHaveLength(10)
    expect(pts[0]).toEqual({ x: 45, y: 0 })
    expect(pts[1]).toEqual({ x: 135, y: 120 })
    expect(pts[9]).toEqual({ x: 855, y: 240 })
  })
  it('aviso quando o Equalizer APO não está instalado aponta para o botão de instalar', () => {
    const t = statusText({ installed: false, state: FLAT, error: '' })
    expect(t).toMatch(/Equalizer APO não encontrado/)
    expect(t).toMatch(/Instalar o Equalizer APO/)
  })
  it('instalando: avisa que o "Sim" do Windows precisa do mouse', () => {
    expect(INSTALL_WAIT).toMatch(/Sim/)
    expect(INSTALL_WAIT).toMatch(/mouse/)
  })
  it('erro de gravação aparece; com tudo certo, nada', () => {
    expect(statusText({ installed: true, state: FLAT, error: 'Sem permissão.' })).toBe('Sem permissão.')
    expect(statusText({ installed: true, state: FLAT, error: '' })).toBe('')
  })
})
