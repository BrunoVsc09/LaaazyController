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
import { editDiff } from '../../shared/edit-diff'

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

  // Tempo real: cada mudança do texto (letra, espaço, apagar, limpar) vai na hora para o campo do
  // site, como "apagar N + digitar o resto" em relação ao que já foi mandado
  const sent = useRef('')

  // Cada vez que o teclado abre: campo vazio, nada mandado ainda e teclado novo
  useEffect(() => {
    setTarget(input.current)
    getLazy()?.oskOverlay.onOpened(() => {
      if (input.current) input.current.value = ''
      sent.current = ''
      setSession((s) => s + 1)
    })
    const el = input.current
    const onInput = () => {
      const next = el?.value ?? ''
      const { back, text } = editDiff(sent.current, next)
      sent.current = next
      if (back || text) void getLazy()?.oskOverlay.edit(back, text)
    }
    el?.addEventListener('input', onInput)
    return () => el?.removeEventListener('input', onInput)
  }, [])

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

  useGamepad(({ fired, dx, dy, buttons }) => {
    if (buttons || dx || dy) padUsed()
    const now = performance.now()
    if ((dx || dy) && now - lastMove.current > REPEAT_MS) { focusMove(NAV, dx, dx ? 0 : dy); lastMove.current = now }
    if (!dx && !dy) lastMove.current = 0
    if (fired(BTN.X)) padClick()
    if (fired(BTN.SQUARE)) press.current?.('backspace')
    if (fired(BTN.TRIANGLE)) press.current?.('space')
    if (fired(BTN.OPTIONS)) close()
    if (fired(BTN.O)) close()
  })

  return (
    <main className="kb-overlay">
      <input ref={input} type={secret ? 'password' : 'text'} hidden readOnly aria-hidden="true" />
      <div className="kb-bar">
        <strong>Teclado do Laaazy</strong>
        <span>O texto vai direto para o campo do site enquanto você digita · Pronto (Options) ou O fecha o teclado</span>
        <button type="button" className="lz-btn" onClick={() => { sounds.click(); setSecret((s) => !s) }}>{secret ? '👁 Mostrar texto' : '🙈 Ocultar (senha)'}</button>
        <button type="button" className="lz-btn" onClick={() => { sounds.click(); close() }}>Fechar</button>
      </div>
      {target && <OnScreenKeyboard key={`${session}-${secret}`} target={target} onClose={close} sounds={sounds} pressRef={press} />}
    </main>
  )
}
