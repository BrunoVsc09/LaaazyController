'use client'

// Teclado do Laaazy que aparece por cima de outros programas (Share no perfil PC / Ctrl+Alt+K).
// Cada tecla vai na hora para o campo selecionado do outro programa; R2 aperta Enter e fecha.
import { useEffect, useRef, useState } from 'react'
import gamepad from '../../shared/gamepad'
import OnScreenKeyboard from '../components/OnScreenKeyboard'
import { useGamepad } from '../hooks/useGamepad'
import { useSounds } from '../hooks/useSounds'
import { focusMove, needsKeyFocus } from '../lib/focus'
import { padClick, useMouseFocus } from '../hooks/useMouseFocus'
import { getLazy } from '../lib/lazy-api'
import { createOskPad, type OskEdit } from '../lib/osk'

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
  const pad = useRef(createOskPad())

  // Cada vez que o teclado abre: campo vazio e teclado novo
  useEffect(() => {
    setTarget(input.current)
    getLazy()?.oskOverlay.onOpened(() => {
      if (input.current) input.current.value = ''
      setSession((s) => s + 1)
    })
  }, [])

  // Tempo real: letra, apagar, cursor (L1/R1) e Enter (R2) vão na hora para o campo do site
  const edit = (change: OskEdit) => { void getLazy()?.oskOverlay.edit(change) }
  const close = () => { void getLazy()?.oskOverlay.close() }

  // Sempre uma tecla com a borda. A janela nunca tem o foco do Windows (o Edge mantém o campo
  // selecionado), então :focus não é desenhado: a tecla atual ganha data-current e o CSS desenha.
  useEffect(() => {
    let current: HTMLElement | null = null
    const mark = () => {
      if (needsKeyFocus(document.activeElement as HTMLElement | null, '.osk button')) document.querySelector<HTMLElement>('.osk button')?.focus()
      const active = document.activeElement as HTMLElement | null
      if (active === current) return
      current?.removeAttribute('data-current')
      current = active?.closest('.kb-overlay button') ? active : null
      current?.setAttribute('data-current', '')
    }
    const t = window.setInterval(mark, 60)
    return () => { window.clearInterval(t); current?.removeAttribute('data-current') }
  }, [session])

  // Mouse e controle sem brigar: a borda só segue o mouse quando ele anda de verdade
  const padUsed = useMouseFocus(() => NAV)

  useGamepad(({ fired, down, dx, dy, buttons }) => {
    if (buttons || dx || dy) padUsed()
    const now = performance.now()
    if ((dx || dy) && now - lastMove.current > REPEAT_MS) { focusMove(NAV, dx, dx ? 0 : dy); lastMove.current = now }
    if (!dx && !dy) lastMove.current = 0
    if (fired(BTN.X)) padClick()
    for (const key of pad.current({ fired, down }, now)) press.current?.(key) // □ △ L1 R1 R2
    if (fired(BTN.OPTIONS)) close()
    if (fired(BTN.O)) close()
  })

  return (
    <main className="kb-overlay">
      <input ref={input} type="text" hidden readOnly aria-hidden="true" />
      <div className="kb-bar">
        <strong>Teclado do Laaazy</strong>
        <span>O texto vai direto para o campo do site · R2 Enter (pesquisar) · □ apaga (segure) · △ espaço · L1/R1 cursor · O fecha</span>
        <button type="button" className="lz-btn" onClick={() => { sounds.click(); setSecret((s) => !s) }}>{secret ? '👁 Mostrar texto' : '🙈 Ocultar (senha)'}</button>
        <button type="button" className="lz-btn" onClick={() => { sounds.click(); close() }}>Fechar</button>
      </div>
      {target && <OnScreenKeyboard key={session} target={target} secret={secret} onEdit={edit} onClose={close} sounds={sounds} pressRef={press} />}
    </main>
  )
}
