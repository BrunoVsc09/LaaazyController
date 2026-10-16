'use client'

// Configurações → Som: saída de som do Windows numa lista curta com setinha (regras em app/lib/audio-outputs).
// X na linha abre a lista; X numa saída troca o som para ela e a guarda como preferida; ○ fecha.
import { useEffect, useRef, useState } from 'react'
import { DEVICE_SELECTOR_HINT, currentOutputName, outputBadge, pickerRows } from '../lib/audio-outputs'
import { getLazy, type AudioOutputs } from '../lib/lazy-api'
import type { Sounds } from '../hooks/useSounds'

type Props = { sounds: Sounds; onMsg: (msg: string) => void }

export default function OutputPicker({ sounds, onMsg }: Props) {
  const lazy = getLazy()
  const [data, setData] = useState<AudioOutputs | null>(null)
  const [open, setOpen] = useState(false)
  const [all, setAll] = useState(false)
  const row = useRef<HTMLButtonElement>(null)

  const load = async (showAll = all) => {
    if (!lazy) return
    const r = await lazy.audio.outputs({ all: showAll })
    setData(r)
    if (!r.ok && r.msg) onMsg(r.msg)
  }
  useEffect(() => { load(false) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const close = () => { setOpen(false); row.current?.focus() }
  // ○ do controle fecha a lista (a tela principal manda lz:close-modal)
  useEffect(() => {
    if (!open) return
    window.addEventListener('lz:close-modal', close)
    return () => window.removeEventListener('lz:close-modal', close)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  // Ao abrir (ou trocar entre lista curta e todas), a borda começa na saída em uso
  useEffect(() => {
    if (!open) return
    const items = document.querySelectorAll<HTMLElement>('.eq-picker button')
    ;(document.querySelector<HTMLElement>('.eq-picker button.is-default') ?? items[0])?.focus()
  }, [open, data])

  const tap = (fn: () => void) => () => { sounds.click(); fn() }
  const toggleOpen = async () => { if (!open) await load(); setOpen(!open) }
  const choose = async (id: string) => {
    if (!lazy) return
    const r = await lazy.audio.setOutput(id)
    onMsg(r.msg)
    await load()
    close()
  }
  const toggleAll = async () => { const v = !all; setAll(v); await load(v) }

  return (
    <div className="eq-output">
      <button ref={row} className="ds4-row" onClick={tap(toggleOpen)} onMouseEnter={sounds.hover} aria-expanded={open}>
        <span>Saída de som</span><b>{currentOutputName(data)} {open ? '▴' : '▾'}</b>
      </button>
      {open && data?.ok && (
        <div className="eq-picker" data-modal role="listbox" aria-label="Saídas de som">
          {pickerRows(data, all).map((r) => (r.kind === 'output'
            ? (
              <button key={r.output.id} type="button" role="option" aria-selected={r.output.isDefault}
                className={r.output.isDefault ? 'is-default' : ''} onClick={tap(() => choose(r.output.id))} onMouseEnter={sounds.hover}>
                <span>{r.label}</span><small>{outputBadge(r.output)}</small>
              </button>
            )
            : <button key="toggle" type="button" className="eq-picker-toggle" onClick={tap(toggleAll)} onMouseEnter={sounds.hover}>{r.label}</button>
          ))}
        </div>
      )}
      <p className="ds4-help eq-output-hint">{DEVICE_SELECTOR_HINT}</p>
    </div>
  )
}
