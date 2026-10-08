'use client'

// Teclado do Laaazy que aparece por cima de outros programas (F19 / Ctrl+Alt+K).
// "Pronto" devolve o foco ao programa de antes e digita o texto no campo selecionado.
import { useEffect, useRef, useState } from 'react'
import gamepad from '../../shared/gamepad'
import OnScreenKeyboard from '../components/OnScreenKeyboard'
import { useGamepad } from '../hooks/useGamepad'
import { useSounds } from '../hooks/useSounds'
import { focusMove, needsKeyFocus } from '../lib/focus'
import { padClick, useMouseFocus } from '../hooks/useMouseFocus'
import { getLazy } from '../lib/lazy-api'

const { BTN } = gamepad
const REPEAT_MS = 220
const NAV = '.kb-overlay button'

export default function KeyboardOverlay() {
  const sounds = useSounds()
  const input = useRef<HTMLInputElement | null>(null)
  const press = useRef<((key: string) => void) | null>(null)
  const [target, setTarget] = useState<HTMLInputElement | null>(null)
  const [session, setSession] = useState(0)
  const [secret, setSecret] = useState(false)
  const lastMove = useRef(0)

  // Cada vez que o teclado abre: campo vazio e teclado novo
  useEffect(() => {
    setTarget(input.current)
    getLazy()?.oskOverlay.onOpened(() => {
      if (input.current) input.current.value = ''
      setSession((s) => s + 1)
    })
  }, [])

  const submit = () => { void getLazy()?.oskOverlay.submit(input.current?.value ?? '') }
  const cancel = () => { void getLazy()?.oskOverlay.cancel() }

  // Sempre uma tecla com a borda: ao abrir e quando a janela ganha o foco do Windows
  useEffect(() => {
    const pick = () => {
      if (needsKeyFocus(document.activeElement as HTMLElement | null, '.osk button')) document.querySelector<HTMLElement>('.osk button')?.focus()
    }
    const t = window.setTimeout(pick, 50)
    window.addEventListener('focus', pick)
    return () => { window.clearTimeout(t); window.removeEventListener('focus', pick) }
  }, [session])

  // Mouse e controle sem brigar: a borda só segue o mouse quando ele anda de verdade
  const padUsed = useMouseFocus(() => NAV)

  useGamepad(({ fired, dx, dy, buttons }) => {
    if (buttons || dx || dy) padUsed()
    const now = performance.now()
    if ((dx || dy) && now - lastMove.current > REPEAT_MS) { focusMove(NAV, dx, dx ? 0 : dy); lastMove.current = now }
    if (!dx && !dy) lastMove.current = 0
    if (fired(BTN.X)) padClick()
    if (fired(BTN.SQUARE)) press.current?.('backspace')
    if (fired(BTN.TRIANGLE)) press.current?.('space')
    if (fired(BTN.OPTIONS)) submit()
    if (fired(BTN.O)) cancel()
  })

  return (
    <main className="kb-overlay">
      <input ref={input} type={secret ? 'password' : 'text'} hidden readOnly aria-hidden="true" />
      <div className="kb-bar">
        <strong>Teclado do Laaazy</strong>
        <span>digita no campo selecionado do programa de trás · Options = Pronto · O = cancelar</span>
        <button type="button" className="lz-btn" onClick={() => { sounds.click(); setSecret((s) => !s) }}>{secret ? '👁 Mostrar texto' : '🙈 Ocultar (senha)'}</button>
        <button type="button" className="lz-btn" onClick={() => { sounds.click(); cancel() }}>Cancelar</button>
      </div>
      {target && <OnScreenKeyboard key={`${session}-${secret}`} target={target} onClose={submit} sounds={sounds} pressRef={press} />}
    </main>
  )
}
