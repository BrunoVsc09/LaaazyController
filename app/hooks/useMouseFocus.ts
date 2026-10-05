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
    const onKey = (e: KeyboardEvent) => { if (e.key.startsWith('Arrow')) padUsed() }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey, true)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey, true)
    }
  }, [padUsed])

  return padUsed
}
