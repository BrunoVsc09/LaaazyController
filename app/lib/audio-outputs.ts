// Saída de som (Configurações → Som): textos e linhas da lista com setinha.
import type { AudioOutput, AudioOutputs } from './lazy-api'

export function currentOutputName(data: AudioOutputs | null): string {
  if (!data) return 'Carregando...'
  if (!data.ok) return 'Indisponível'
  return data.items.find((o) => o.isDefault)?.name ?? 'Nenhuma'
}

export const outputBadge = (o: AudioOutput) =>
  [o.isDefault && '● em uso', o.preferred && '★ preferida'].filter(Boolean).join(' · ')

export type PickerRow = { kind: 'output'; label: string; output: AudioOutput } | { kind: 'toggle'; label: string }

// As saídas e, no fim, o botão para ver as escondidas (ou voltar para a lista curta)
export function pickerRows(data: AudioOutputs, all: boolean): PickerRow[] {
  const rows: PickerRow[] = data.items.map((o) => ({ kind: 'output', label: o.name, output: o }))
  if (all) rows.push({ kind: 'toggle', label: 'Mostrar só as principais' })
  else if (data.hidden > 0) rows.push({ kind: 'toggle', label: `Mostrar todas (${data.hidden} escondidas)` })
  return rows
}

export const DEVICE_SELECTOR_HINT = 'O equalizador só vale nas saídas marcadas no Device Selector do Equalizer APO (menu Iniciar).'
