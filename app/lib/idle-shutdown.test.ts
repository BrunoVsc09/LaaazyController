import { describe, it, expect } from 'vitest'
import { idleWarningText, nextIdleHours, idleHoursLabel, idleHoursMsg } from './idle-shutdown'

describe('desligar o PC sem uso (Configurações → Sistema)', () => {
  it('Nunca, 2, 3, 4 e 6 horas, em volta', () => {
    expect(nextIdleHours(0)).toBe(2)
    expect(nextIdleHours(4)).toBe(6)
    expect(nextIdleHours(6)).toBe(0)
  })
  it('rótulo e aviso', () => {
    expect(idleHoursLabel(0)).toBe('Nunca')
    expect(idleHoursLabel(4)).toBe('4 h')
    expect(idleHoursMsg(4)).toBe('O PC desliga sozinho depois de 4 horas sem ninguém usar o controle, o mouse ou o teclado (avisa 1 minuto antes).')
    expect(idleHoursMsg(0)).toBe('O PC não desliga sozinho.')
  })
  it('aviso por cima da tela com os segundos que faltam', () => {
    expect(idleWarningText(35)).toBe('O PC vai desligar em 35 s por falta de uso. Mexa no controle, no mouse ou no teclado para cancelar.')
  })
})
