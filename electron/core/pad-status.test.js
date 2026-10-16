import { describe, it, expect } from 'vitest'
import mod from './pad-status.js'

const { parseBattery, batteryAlert, alertText, PAD_IDLE_MINUTES } = mod

describe('pad-status: bateria do controle (Query.1.Battery do Laaazy-pad)', () => {
  it('lê "<porcentagem> <estado>"', () => {
    expect(parseBattery('40 descarregando')).toEqual({ percent: 40, state: 'descarregando' })
    expect(parseBattery('65 carregando')).toEqual({ percent: 65, state: 'carregando' })
    expect(parseBattery('-1 cabo')).toEqual({ percent: -1, state: 'cabo' })
  })
  it('sem controle, fechado ou texto estranho: null', () => {
    for (const t of ['nenhum', null, '', 'Jogos', '40', '40 voando', '140 descarregando']) expect(parseBattery(t), String(t)).toBeNull()
  })
})

describe('pad-status: aviso de bateria baixa (20% e 10%, uma vez em cada nível)', () => {
  const on = (percent) => ({ percent, state: 'descarregando' })
  it('avisa aos 20% e de novo aos 10%', () => {
    let s = batteryAlert(on(30), null)
    expect(s.alert).toBeNull()
    s = batteryAlert(on(20), s.warned)
    expect(s.alert).toBe(20)
    s = batteryAlert(on(20), s.warned)
    expect(s.alert).toBeNull() // já avisou nesse nível
    s = batteryAlert(on(10), s.warned)
    expect(s.alert).toBe(10)
    expect(batteryAlert(on(0), s.warned).alert).toBeNull()
  })
  it('caiu direto para 10%: um aviso só, o de 10%', () => {
    const s = batteryAlert(on(10), null)
    expect(s.alert).toBe(10)
    expect(batteryAlert(on(20), s.warned).alert).toBeNull()
  })
  it('carregando, no cabo ou sem saber: não avisa e o aviso volta a valer', () => {
    const avisado = batteryAlert(on(10), null).warned
    for (const state of ['carregando', 'carregado', 'cabo', 'desconhecido']) {
      const s = batteryAlert({ percent: 10, state }, avisado)
      expect(s.alert, state).toBeNull()
      expect(s.warned, state).toBeNull()
    }
  })
  it('subiu acima de 20% (carregou um pouco): o aviso volta a valer', () => {
    const s = batteryAlert(on(30), batteryAlert(on(10), null).warned)
    expect(s.warned).toBeNull()
    expect(batteryAlert(on(20), s.warned).alert).toBe(20)
  })
  it('sem controle: guarda o que já avisou', () => {
    expect(batteryAlert(null, 20)).toEqual({ alert: null, warned: 20 })
  })
  it('texto do aviso', () => {
    expect(alertText(20)).toBe('Bateria do controle em 20%. Conecte o cabo quando puder.')
    expect(alertText(10)).toBe('Bateria do controle em 10%: conecte o cabo para não desligar.')
  })
  it('tempos para desligar o controle parado (0 = nunca)', () => {
    expect(PAD_IDLE_MINUTES).toEqual([0, 5, 10, 15, 30])
  })
})
