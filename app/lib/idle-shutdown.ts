// Sistema: desligar o PC sem uso (Configurações → Sistema) e o aviso de 1 minuto antes.
import idleOptions from '../../shared/idle-options'

const OPTIONS: number[] = idleOptions.IDLE_HOURS
export const nextIdleHours = (h: number) => OPTIONS[(OPTIONS.indexOf(h) + 1) % OPTIONS.length]
export const idleHoursLabel = (h: number) => (h ? `${h} h` : 'Nunca')
export const idleHoursMsg = (h: number) => (h
  ? `O PC desliga sozinho depois de ${h} horas sem ninguém usar o controle, o mouse ou o teclado (avisa 1 minuto antes).`
  : 'O PC não desliga sozinho.')

export const idleWarningText = (seconds: number) =>
  `O PC vai desligar em ${seconds} s por falta de uso. Mexa no controle, no mouse ou no teclado para cancelar.`
