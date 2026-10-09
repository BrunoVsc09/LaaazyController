'use client'

// Mouse e controle juntos sem brigar: o foco (borda amarela) só segue o mouse quando ele
// se move de verdade; usando o controle, o cursor some (classe lz-pad no <html>).
// Clicar no fundo da tela não tira o foco de onde ele está.
import { useCallback, useEffect, useRef } from 'react'
import { hoverTarget, keepsFocusOnPress } from '../lib/focus'
import { inputMode } from '../lib/input-mode'

export function useMouseFocus(selector: () => string) {
  const mode = useRef(inputMode)
  const sel = useRef(selector)
  sel.current = selector

  const sync = () => document.documentElement.classList.toggle('lz-pad', mode.current.mode() === 'pad')
  // Chamado pelo controle e pelas setas do teclado
  const padUsed = useCallback(() => { mode.current.padUsed(); sync() }, [])

  useEffect(() => {
    sync()
    const onMove = (e: MouseEvent) => {
      if (!mode.current.mouseMoved(e.screenX, e.screenY)) return
      sync()
      const el = hoverTarget(e.target as HTMLElement, document.activeElement as HTMLElement | null, sel.current()) as HTMLElement | null
      el?.focus({ preventScroll: true })
    }
    const onDown = (e: MouseEvent) => { if (keepsFocusOnPress(e.target as HTMLElement)) e.preventDefault() }
    // Modo controle: cliques do mouse (o perfil PC do Laaazy-pad transforma X/O em clique) são ignorados;
    // quem aperta é o X do controle, no item com a borda. Mexer o mouse de verdade libera.
    const swallow = (e: MouseEvent) => {
      if (!e.isTrusted || mode.current.mouseButtonsWork()) return
      e.preventDefault()
      e.stopPropagation()
    }
    const BUTTON_EVENTS = ['mousedown', 'mouseup', 'click', 'dblclick', 'auxclick', 'contextmenu'] as const
    for (const ev of BUTTON_EVENTS) window.addEventListener(ev, swallow, true)
    const onKey = (e: KeyboardEvent) => { if (e.key.startsWith('Arrow')) padUsed() }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey, true)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey, true)
      for (const ev of BUTTON_EVENTS) window.removeEventListener(ev, swallow, true)
    }
  }, [padUsed])

  return padUsed
}

// X do controle: aperta o item com a borda só no modo controle (no modo mouse, o clique do mouse já apertou)
export function padClick() {
  if (inputMode.padClicks()) (document.activeElement as HTMLElement | null)?.click()
}
