'use client'

// Cartão compacto de uma chave nas boas-vindas: o que faz, onde pegar, e colar/salvar.
// A chave só passa pela tela uma vez (vai criptografada para o Electron e nunca volta).
import { useState } from 'react'
import { getLazy, type Result } from '../../lib/lazy-api'
import type { Sounds } from '../../hooks/useSounds'

type Props = {
  title: string; what: string; where: string; required: boolean; configured: boolean; note?: string
  sounds: Sounds; onSave: (key: string) => Promise<Result>; onResult: (msg: string, ok: boolean) => void
}

export default function ApiCard({ title, what, where, required, configured, note, sounds, onSave, onResult }: Props) {
  const [key, setKey] = useState('')
  const save = async (k: string) => {
    if (!k.trim()) return onResult('Cole ou digite a chave primeiro.', configured)
    onResult('Testando a chave...', configured)
    const r = await onSave(k)
    if (r.ok) setKey('')
    onResult(r.msg, r.ok || configured)
  }
  // Sem mouse: cola o que está copiado e já salva
  const pasteAndSave = async () => {
    const text = await getLazy()?.clipboard.read()
    if (text) await save(text)
    else onResult('Não há nada copiado. Copie a chave (Ctrl+C) e tente de novo.', configured)
  }
  const tap = (fn: () => void) => () => { sounds.click(); fn() }
  return (
    <section className="welcome-box welcome-api">
      <h3 style={{ textTransform: 'none', letterSpacing: 0, fontSize: 18, color: '#fff' }}>
        {title}<span className={`welcome-tag ${configured ? 'ok' : required ? 'req' : ''}`}>{configured ? 'ligada' : required ? 'recomendada' : 'opcional'}</span>
      </h3>
      <p>{what}</p>
      <p className="welcome-muted">{where}</p>
      <input type="password" autoComplete="off" spellCheck={false} value={key} onChange={(e) => setKey(e.target.value)}
        placeholder={configured ? 'colar outra chave para trocar' : 'colar a chave aqui'} aria-label={`Chave: ${title}`} />
      <div className="welcome-api-actions">
        <button type="button" className="welcome-btn" onClick={tap(pasteAndSave)}>Colar e salvar</button>
        {key.trim() && <button type="button" className="welcome-btn primary" onClick={tap(() => save(key))}>Salvar</button>}
      </div>
      {note && <p className="welcome-muted" style={{ fontSize: 12.5 }}>{note}</p>}
    </section>
  )
}
