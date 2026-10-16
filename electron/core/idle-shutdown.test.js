import { describe, it, expect } from 'vitest'
import mod from './idle-shutdown.js'

const { idleSeconds, decide, blocksSuspend, IDLE_HOURS, WARNING_SECONDS } = mod
const H = 3600

describe('idle-shutdown: tempo sem uso do PC', () => {
  it('o menor entre teclado/mouse (Windows) e o controle (Laaazy-pad)', () => {
    expect(idleSeconds(5000, 30)).toBe(30) // jogando só com o controle: não está parado
    expect(idleSeconds(30, 5000)).toBe(30) // usando o mouse com o controle na mesa
  })
  it('sem o Laaazy-pad (fechado ou antigo): só teclado e mouse', () => {
    expect(idleSeconds(5000, null)).toBe(5000)
  })
})

describe('idle-shutdown: decidir (aviso de 60 s antes de desligar)', () => {
  it('opções: Nunca (padrão), 2, 3, 4 ou 6 h; aviso de 60 s', () => {
    expect(IDLE_HOURS).toEqual([0, 2, 3, 4, 6])
    expect(WARNING_SECONDS).toBe(60)
  })
  it('antes do tempo: nada', () => {
    expect(decide({ hours: 4, idle: 4 * H - 1, warning: null })).toEqual({ action: 'none', warning: null })
  })
  it('passou do tempo: avisa, com 60 s para desistir', () => {
    expect(decide({ hours: 4, idle: 4 * H, warning: null })).toEqual({ action: 'warn', seconds: 60, warning: { idleAtStart: 4 * H } })
  })
  it('durante o aviso: conta os segundos que faltam', () => {
    expect(decide({ hours: 4, idle: 4 * H + 25, warning: { idleAtStart: 4 * H } }))
      .toEqual({ action: 'countdown', seconds: 35, warning: { idleAtStart: 4 * H } })
  })
  it('mexeu em qualquer coisa durante o aviso: cancela', () => {
    expect(decide({ hours: 4, idle: 3, warning: { idleAtStart: 4 * H } })).toEqual({ action: 'cancel', warning: null })
  })
  it('acabaram os 60 s: desliga', () => {
    expect(decide({ hours: 4, idle: 4 * H + 60, warning: { idleAtStart: 4 * H } })).toEqual({ action: 'shutdown', warning: null })
  })
  it('Nunca: nada; se trocou para Nunca no meio do aviso, cancela', () => {
    expect(decide({ hours: 0, idle: 99 * H, warning: null })).toEqual({ action: 'none', warning: null })
    expect(decide({ hours: 0, idle: 99 * H, warning: { idleAtStart: 4 * H } })).toEqual({ action: 'cancel', warning: null })
  })
  it('enquanto a opção está ligada, o Windows não suspende antes (o Laaazy congelaria junto)', () => {
    expect(blocksSuspend(4)).toBe(true)
    expect(blocksSuspend(0)).toBe(false)
  })
})
