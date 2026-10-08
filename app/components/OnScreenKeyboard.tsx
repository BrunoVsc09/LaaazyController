'use client'

import { useEffect, useRef, useState, type MutableRefObject } from 'react'
import { OSK_ROWS, KEY_LABEL, KEY_PAD, applyKey, splitAtCaret, upper, type OskEdit } from '../lib/osk'
import type { Sounds } from '../hooks/useSounds'

// Muda o valor de um <input> controlado pelo React (o onChange da tela recebe normalmente)
function setInputValue(el: HTMLInputElement, value: string) {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(el, value)
  el.dispatchEvent(new Event('input', { bubbles: true }))
}

// Leva o cursor do campo junto (campos como e-mail não aceitam; aí fica onde está)
function setCaret(el: HTMLInputElement, caret: number) {
  try { el.setSelectionRange(caret, caret) } catch { /* tipo de campo sem cursor */ }
}

type Props = {
  target: HTMLInputElement
  onClose: () => void
  sounds: Sounds
  pressRef: MutableRefObject<((key: string) => void) | null> // botões do controle chegam por aqui
  secret?: boolean // mostrar bolinhas (padrão: se o campo é de senha)
  onEdit?: (edit: OskEdit) => void // teclado por cima: cada tecla vai para o campo do outro programa
}

export default function OnScreenKeyboard({ target, onClose, sounds, pressRef, secret = target.type === 'password', onEdit }: Props) {
  const [state, setState] = useState({ value: target.value, caret: target.value.length, shift: false, caps: false })
  const stateRef = useRef(state)
  stateRef.current = state

  const press = (key: string) => {
    const next = applyKey(stateRef.current, key)
    if (next.value !== stateRef.current.value) setInputValue(target, next.value)
    setCaret(target, next.caret)
    const { value, caret, shift, caps } = next
    stateRef.current = { value, caret, shift, caps } // teclas seguidas no mesmo quadro (□ segurado)
    setState(stateRef.current)
    if (next.edit) onEdit?.(next.edit)
    if (next.done) onClose()
  }
  pressRef.current = press

  useEffect(() => {
    document.querySelector<HTMLElement>('.osk button')?.focus()
    return () => { pressRef.current = null }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const [before, after] = splitAtCaret(state.value, state.caret, secret)
  return (
    <div className="osk" role="dialog" aria-label="Teclado na tela">
      <div className="osk-value" aria-live="polite">
        {state.value
          ? <>{before}<span className="osk-caret" aria-hidden="true" />{after}</>
          : <><span className="osk-caret" aria-hidden="true" /><span className="osk-placeholder">{target.placeholder || 'Digite...'}</span></>}
      </div>
      <div className="osk-keys">
        {OSK_ROWS.flat().map((k) => (
          <button key={k} type="button" data-key={k} className={`osk-key ${KEY_LABEL[k] ? 'special' : ''} ${(k === 'shift' && state.shift) || (k === 'caps' && state.caps) ? 'on' : ''}`}
            onClick={() => { sounds.click(); press(k) }}>
            {KEY_LABEL[k] ?? (upper(state) ? k.toUpperCase() : k)}
            {KEY_PAD[k] && <small className="osk-pad">{KEY_PAD[k]}</small>}
          </button>
        ))}
      </div>
    </div>
  )
}
