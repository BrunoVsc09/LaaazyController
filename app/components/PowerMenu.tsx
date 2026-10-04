'use client'

import { useEffect, useState } from 'react'
import { getLazy } from '../lib/lazy-api'
import type { Sounds } from '../hooks/useSounds'

type Action = 'quit' | 'suspend' | 'shutdown'
const OPTIONS: { action: Action; label: string }[] = [
  { action: 'quit', label: 'Fechar o Laaazy' },
  { action: 'suspend', label: 'Suspender o PC' },
  { action: 'shutdown', label: 'Desligar o PC' },
]

// Suspender e desligar pedem uma segunda confirmação
export default function PowerMenu({ onClose, sounds }: { onClose: () => void; sounds: Sounds }) {
  const [pending, setPending] = useState<Action | null>(null)
  const [msg, setMsg] = useState('')

  useEffect(() => { document.querySelector<HTMLElement>('.power-menu button')?.focus() }, [pending])

  const run = async (action: Action, confirmed = false) => {
    const r = await getLazy()?.power.run(action, confirmed)
    if (!r) return
    if (r.confirm) { setPending(action); setMsg(r.msg ?? ''); return }
    if (!r.ok) setMsg(r.msg ?? '')
    else onClose()
  }
  const tap = (fn: () => void) => () => { sounds.click(); fn() }

  return (
    <div className="power-menu" role="dialog" aria-label="Energia">
      {pending ? (
        <>
          <p>{msg}</p>
          <button type="button" className="lz-btn primary" onClick={tap(() => run(pending, true))}>Sim, {pending === 'shutdown' ? 'desligar' : 'suspender'}</button>
          <button type="button" className="lz-btn" onClick={tap(() => { setPending(null); setMsg('') })}>Cancelar</button>
        </>
      ) : (
        <>
          {OPTIONS.map((o) => <button key={o.action} type="button" className="lz-btn" onClick={tap(() => run(o.action))}>{o.label}</button>)}
          <button type="button" className="lz-btn" onClick={tap(onClose)}>Cancelar</button>
          {msg && <p role="status">{msg}</p>}
        </>
      )}
    </div>
  )
}
