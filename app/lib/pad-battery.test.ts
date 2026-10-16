import { describe, it, expect } from 'vitest'
import { batteryView, nextPadIdle, padIdleLabel, padIdleMsg } from './pad-battery'

describe('bateria do controle no topo', () => {
  it('sem controle (ou Laaazy-pad fechado): não mostra nada', () => {
    expect(batteryView(null)).toBeNull()
  })
  it('descarregando: porcentagem e o nível do ícone', () => {
    expect(batteryView({ percent: 80, state: 'descarregando' })).toEqual({ text: '80%', level: 'full', title: 'Bateria do controle: 80%' })
    expect(batteryView({ percent: 50, state: 'descarregando' })).toMatchObject({ level: 'medium' })
    expect(batteryView({ percent: 20, state: 'descarregando' })).toMatchObject({ level: 'low' })
  })
  it('carregando ou carregado: raio no ícone', () => {
    expect(batteryView({ percent: 65, state: 'carregando' })).toEqual({ text: '65%', level: 'charging', title: 'Bateria do controle: 65%, carregando' })
    expect(batteryView({ percent: 100, state: 'carregado' })).toEqual({ text: '100%', level: 'charging', title: 'Bateria do controle: carregada' })
  })
  it('controle que não informa a bateria (cabo, desconhecido): não mostra nada', () => {
    expect(batteryView({ percent: -1, state: 'cabo' })).toBeNull()
    expect(batteryView({ percent: -1, state: 'desconhecido' })).toBeNull()
  })
})

describe('desligar o controle parado (Configurações → Controle e mouse)', () => {
  it('Nunca, 5, 10, 15 e 30 minutos, em volta', () => {
    expect(nextPadIdle(10)).toBe(15)
    expect(nextPadIdle(30)).toBe(0)
    expect(nextPadIdle(0)).toBe(5)
  })
  it('rótulo e aviso', () => {
    expect(padIdleLabel(10)).toBe('10 min')
    expect(padIdleLabel(0)).toBe('Nunca')
    expect(padIdleMsg(10)).toBe('O controle no Bluetooth desliga sozinho depois de 10 minutos parado. O PS liga de novo.')
    expect(padIdleMsg(0)).toBe('O controle não desliga sozinho.')
  })
})
