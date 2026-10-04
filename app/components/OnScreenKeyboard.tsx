'use client'

import { useEffect, useRef, useState, type MutableRefObject } from 'react'
import { OSK_ROWS, KEY_LABEL, applyKey, maskValue } from '../lib/osk'
import type { Sounds } from '../hooks/useSounds'

// Muda o valor de um <input> controlado pelo React (o onChange da tela recebe normalmente)
function setInputValue(el: HTMLInputElement, value: string) {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(el, value)
  el.dispatchEvent(new Event('input', { bubbles: true }))
}

type Props = {
  target: HTMLInputElement
  onClose: () => void
  sounds: Sounds
  pressRef: MutableRefObject<((key: string) => void) | null> // □ e △ do controle chegam por aqui
}

export default function OnScreenKeyboard({ target, onClose, sounds, pressRef }: Props) {
  const [state, setState] = useState({ value: target.value, shift: false })
  const stateRef = useRef(state)
  stateRef.current = state
  const secret = target.type === 'password'

  const press = (key: string) => {
    const next = applyKey(stateRef.current, key)
    if (next.value !== stateRef.current.value) setInputValue(target, next.value)
    setState({ value: next.value, shift: next.shift })
    if (next.done) onClose()
  }
  pressRef.current = press

  useEffect(() => {
    document.querySelector<HTMLElement>('.osk button')?.focus()
    return () => { pressRef.current = null }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="osk" role="dialog" aria-label="Teclado na tela">
      <div className="osk-value" aria-live="polite">{maskValue(state.value, secret) || <span className="osk-placeholder">{target.placeholder || 'Digite...'}</span>}</div>
      {OSK_ROWS.map((row, i) => (
        <div key={i} className="osk-row">
          {row.map((k) => (
            <button key={k} type="button" className={`osk-key ${KEY_LABEL[k] ? 'wide' : ''} ${k === 'shift' && state.shift ? 'on' : ''}`}
              onClick={() => { sounds.click(); press(k) }}>
              {KEY_LABEL[k] ?? (state.shift ? k.toUpperCase() : k)}
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}
