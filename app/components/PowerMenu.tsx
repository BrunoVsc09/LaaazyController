'use client'

import { useEffect, useState } from 'react'
import { getLazy, type PowerAction } from '../lib/lazy-api'
import type { Sounds } from '../hooks/useSounds'

const OPTIONS: { action: PowerAction; label: string }[] = [
  { action: 'shutdown_3h', label: 'Desligar daqui a 3 horas' },
  { action: 'shutdown_2h', label: 'Desligar daqui a 2 horas' },
  { action: 'shutdown_cancel', label: 'Cancelar o desligamento' },
  { action: 'shutdown', label: 'Desligar o PC' },
  { action: 'suspend', label: 'Suspender o PC' },
  { action: 'quit', label: 'Fechar o Laaazy' },
]

// Tudo que mexe no PC pergunta "você tem certeza?" (Sim / Não) antes
export default function PowerMenu({ onClose, sounds }: { onClose: () => void; sounds: Sounds }) {
  const [pending, setPending] = useState<PowerAction | null>(null)
  const [msg, setMsg] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => { document.querySelector<HTMLElement>('.power-menu button')?.focus() }, [pending, done])

  const run = async (action: PowerAction, confirmed = false) => {
    const r = await getLazy()?.power.run(action, confirmed)
    if (!r) return
    if (r.confirm) { setPending(action); setMsg(r.msg ?? ''); return }
    setPending(null)
    // Agendou ou cancelou: mostra a hora/resultado antes de fechar
    if (r.msg) { setMsg(r.msg); setDone(true); return }
    if (r.ok) onClose()
  }
  const tap = (fn: () => void) => () => { sounds.click(); fn() }

  return (
    <div className="power-menu" role="dialog" aria-label="Energia">
      {pending ? (
        <>
          <p>{msg}</p>
          <button type="button" className="lz-btn primary" onClick={tap(() => run(pending, true))}>Sim</button>
          <button type="button" className="lz-btn" onClick={tap(() => { setPending(null); setMsg('') })}>Não</button>
        </>
      ) : done ? (
        <>
          <p role="status">{msg}</p>
          <button type="button" className="lz-btn primary" onClick={tap(onClose)}>OK</button>
        </>
      ) : (
        <>
          {OPTIONS.map((o) => <button key={o.action} type="button" className="lz-btn" onClick={tap(() => run(o.action))}>{o.label}</button>)}
          <button type="button" className="lz-btn" onClick={tap(onClose)}>Voltar</button>
        </>
      )}
    </div>
  )
}
