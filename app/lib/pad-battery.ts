// Controle: a bateria no topo (ao lado do relógio) e o tempo para desligar o controle parado.
import idleOptions from '../../shared/idle-options'
import type { PadBattery } from './lazy-api'

export type BatteryLevel = 'full' | 'medium' | 'low' | 'charging'
export type BatteryView = { text: string; level: BatteryLevel; title: string }

// null = não mostra (sem controle, ou um controle que não informa a bateria)
export function batteryView(b: PadBattery): BatteryView | null {
  if (!b || b.percent < 0) return null
  const text = `${b.percent}%`
  if (b.state === 'carregado') return { text, level: 'charging', title: 'Bateria do controle: carregada' }
  if (b.state === 'carregando') return { text, level: 'charging', title: `Bateria do controle: ${text}, carregando` }
  if (b.state !== 'descarregando') return null
  const level: BatteryLevel = b.percent > 60 ? 'full' : b.percent > 20 ? 'medium' : 'low'
  return { text, level, title: `Bateria do controle: ${text}` }
}

const OPTIONS: number[] = idleOptions.PAD_IDLE_MINUTES
export const nextPadIdle = (m: number) => OPTIONS[(OPTIONS.indexOf(m) + 1) % OPTIONS.length]
export const padIdleLabel = (m: number) => (m ? `${m} min` : 'Nunca')
export const padIdleMsg = (m: number) => (m
  ? `O controle no Bluetooth desliga sozinho depois de ${m} minutos parado. O PS liga de novo.`
  : 'O controle não desliga sozinho.')
