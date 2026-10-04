'use client'

import { useState } from 'react'
import type { Result } from '../lib/lazy-api'
import type { Sounds } from '../hooks/useSounds'

type Props = {
  title: string
  help: string
  configured: boolean
  note?: string
  sounds: Sounds
  onSave: (key: string) => Promise<Result>
  onClear: () => Promise<Result>
  onResult: (msg: string, configured: boolean) => void
}

// Campo de chave de API: colar, testar e guardar (criptografada pelo Electron) ou remover.
// A chave só passa pela tela uma vez; ela nunca volta do Electron.
export default function ApiKeySection({ title, help, configured, note, sounds, onSave, onClear, onResult }: Props) {
  const [key, setKey] = useState('')
  const save = async () => {
    onResult('Testando a chave...', configured)
    const r = await onSave(key)
    if (r.ok) setKey('')
    onResult(r.msg, r.ok || configured)
  }
  const clear = async () => onResult((await onClear()).msg, false)

  return (
    <>
      <h2 className="ds4-help">{title}</h2>
      <p className="ds4-help">{configured ? 'Chave configurada.' : 'Sem chave.'} {help}</p>
      <label className="ds4-row" style={{ cursor: 'text' }}>
        <span>Chave</span>
        <input type="password" autoComplete="off" spellCheck={false} value={key} onChange={(e) => setKey(e.target.value)}
          placeholder={configured ? 'colar outra chave para trocar' : 'colar aqui'} aria-label={`Chave do ${title}`}
          style={{ flex: 1, marginLeft: 24, background: 'transparent', border: 0, color: 'inherit', font: 'inherit', textAlign: 'right' }} />
      </label>
      <button className="ds4-row" onClick={() => { sounds.click(); save() }} onMouseEnter={sounds.hover} disabled={!key.trim()}><span>Salvar e testar a chave</span><b>▶</b></button>
      {configured && <button className="ds4-row" onClick={() => { sounds.click(); clear() }} onMouseEnter={sounds.hover}><span>Remover a chave</span><b>✕</b></button>}
      {note && <p className="ds4-help" style={{ fontSize: '0.85em', opacity: 0.8 }}>{note}</p>}
    </>
  )
}
