'use client'

// Painel "Editar <botão>" do editor de perfis: tecla (comum ou gravada no teclado), clique ou nada.
import { useEffect, useState } from 'react'
import { CLICK_OPTIONS, COMMON_KEYS, actionLabel, shortcutFromKey } from '../lib/pad-editor'
import type { PadAction, PadButton } from '../lib/lazy-api'
import type { Sounds } from '../hooks/useSounds'

type Kind = 'tecla' | 'clique' | 'nada'
type Props = { button: PadButton; onSave: (action: PadAction) => void; sounds: Sounds }

const kindOf = (a: PadAction): Kind => (!a ? 'nada' : 'clique' in a ? 'clique' : 'tecla')

export default function PadEditPanel({ button, onSave, sounds }: Props) {
  const [kind, setKind] = useState<Kind>(kindOf(button.action))
  const [recording, setRecording] = useState(false)
  useEffect(() => { setKind(kindOf(button.action)); setRecording(false) }, [button.id, button.action])

  // Gravar atalho: a primeira combinação completa apertada no teclado vira a tecla do botão
  useEffect(() => {
    if (!recording) return
    const onKey = (e: KeyboardEvent) => {
      e.preventDefault()
      const shortcut = shortcutFromKey(e)
      if (!shortcut) return
      setRecording(false)
      onSave({ tecla: shortcut })
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [recording]) // eslint-disable-line react-hooks/exhaustive-deps

  const tap = (fn: () => void) => () => { sounds.click(); fn() }
  const current = (a: PadAction) => JSON.stringify(a) === JSON.stringify(button.action)

  if (button.locked) {
    return (
      <div className="pad-panel">
        <p className="pad-panel-title">Editar <b>{button.label}</b></p>
        <p className="pad-hint">Comando fixo do Laaazy: {actionLabel(button.action)}. Ele não pode mudar.</p>
      </div>
    )
  }
  return (
    <div className="pad-panel">
      <p className="pad-panel-title">Editar <b>{button.label}</b> · agora: {actionLabel(button.action)}</p>
      <div className="pad-opts">
        {(['tecla', 'clique', 'nada'] as Kind[]).map((k) => (
          <button key={k} type="button" className={`pad-opt ${kind === k ? 'on' : ''}`} onClick={tap(() => (k === 'nada' ? onSave(null) : setKind(k)))}>
            {k === 'tecla' ? 'Tecla' : k === 'clique' ? 'Clique' : 'Nada'}
          </button>
        ))}
      </div>
      {kind === 'clique' && (
        <div className="pad-opts">
          {CLICK_OPTIONS.map((c) => (
            <button key={c.value} type="button" className={`pad-opt ${current({ clique: c.value }) ? 'on' : ''}`} onClick={tap(() => onSave({ clique: c.value }))}>{c.label}</button>
          ))}
        </div>
      )}
      {kind === 'tecla' && (
        <div className="pad-opts">
          {COMMON_KEYS.map((k) => (
            <button key={k} type="button" className={`pad-opt ${current({ tecla: k }) ? 'on' : ''}`} onClick={tap(() => onSave({ tecla: k }))}>{k}</button>
          ))}
          <button type="button" className={`pad-opt rec ${recording ? 'on' : ''}`} onClick={tap(() => setRecording((r) => !r))}>
            {recording ? 'Aperte o atalho no teclado...' : 'Gravar atalho no teclado'}
          </button>
        </div>
      )}
    </div>
  )
}
