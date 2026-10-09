'use client'

// Ao abrir o Laaazy: se há versão nova no GitHub, pergunta se quer atualizar.
// ✕ escolhe, ○ fecha (é "Depois"); na próxima vez que o Laaazy abrir, pergunta de novo.
import { useEffect, useRef, useState } from 'react'
import { getLazy } from '../lib/lazy-api'
import { updateCopy } from '../lib/update'
import type { Sounds } from '../hooks/useSounds'

type Offer = { version: string; canInstall: boolean }

export default function UpdatePrompt({ sounds }: { sounds: Sounds }) {
  const lazy = getLazy()
  const [offer, setOffer] = useState<Offer | null>(null)
  const open = useRef(false)
  open.current = !!offer
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  // Ao fechar, a borda volta para onde estava antes do aviso aparecer. O ○ manda lz:close-modal para
  // qualquer janelinha aberta: com o aviso fechado, não mexe em nada
  const before = useRef<HTMLElement | null>(null)
  const close = () => {
    if (!open.current) return
    open.current = false
    setOffer(null)
    window.setTimeout(() => (before.current?.isConnected ? before.current : document.querySelector<HTMLElement>('.ps4-screen button'))?.focus(), 0)
  }

  useEffect(() => {
    lazy?.update.check().then((r) => { if (r.available) setOffer({ version: r.version, canInstall: r.canInstall }) })
    window.addEventListener('lz:close-modal', close)
    return () => window.removeEventListener('lz:close-modal', close)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!offer) return
    before.current = document.activeElement as HTMLElement | null
    document.querySelector<HTMLElement>('.lz-update button')?.focus()
  }, [offer])

  if (!offer) return null
  const copy = updateCopy(offer)

  const install = async () => {
    sounds.click()
    setBusy(true)
    setMsg(offer.canInstall ? 'Baixando a atualização...' : '')
    const r = await lazy?.update.install()
    setBusy(false)
    if (r && !r.ok) setMsg(r.msg)
    else if (!offer.canInstall) close() // portátil: a página abriu no navegador
  }

  return (
    <div className="power-menu lz-update" data-modal role="dialog" aria-label={copy.title}>
      <p><strong>{copy.title}</strong><br />{copy.body}</p>
      {msg && <p className="lz-meta" role="status">{msg}</p>}
      <button type="button" className="lz-btn primary" disabled={busy} onClick={install}>{copy.action}</button>
      <button type="button" className="lz-btn" disabled={busy} onClick={() => { sounds.click(); close() }}>Depois</button>
    </div>
  )
}
