'use client'

// Teclado do Laaazy que aparece por cima de outros programas (F19 / Ctrl+Alt+K).
// "Pronto" devolve o foco ao programa de antes e digita o texto no campo selecionado.
import { useEffect, useRef, useState } from 'react'
import gamepad from '../../shared/gamepad'
import OnScreenKeyboard from '../components/OnScreenKeyboard'
import { useGamepad } from '../hooks/useGamepad'
import { useSounds } from '../hooks/useSounds'
import { focusMove, hoverTarget, keepsFocusOnPress } from '../lib/focus'
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

  // Cursor do analógico: a borda acompanha o cursor e clicar no fundo não a apaga
  useEffect(() => {
    const onOver = (e: MouseEvent) => {
      const el = hoverTarget(e.target as HTMLElement, document.activeElement as HTMLElement | null, NAV) as HTMLElement | null
      el?.focus({ preventScroll: true })
    }
    const onDown = (e: MouseEvent) => { if (keepsFocusOnPress(e.target as HTMLElement)) e.preventDefault() }
    window.addEventListener('mouseover', onOver)
    window.addEventListener('mousedown', onDown)
    return () => { window.removeEventListener('mouseover', onOver); window.removeEventListener('mousedown', onDown) }
  }, [])

  useGamepad(({ fired, dx, dy }) => {
    const now = performance.now()
    if ((dx || dy) && now - lastMove.current > REPEAT_MS) { focusMove(NAV, dx, dx ? 0 : dy); lastMove.current = now }
    if (!dx && !dy) lastMove.current = 0
    if (fired(BTN.X)) (document.activeElement as HTMLElement | null)?.click()
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
