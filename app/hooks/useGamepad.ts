'use client'

import { useEffect, useRef, useState } from 'react'
import gamepad from '../../shared/gamepad'
import { padActive } from '../lib/screensaver'
import { inputMode } from '../lib/input-mode'

// buttons: algum botão apertado (D-pad incluso). dx/dy: D-pad, ou o analógico quando ele não está
// fazendo o papel de mouse (perfil PC do DS4Windows)
// down: o botão está apertado agora (para repetir segurando)
export type PadFrame = { fired: (button: number) => boolean; down: (button: number) => boolean; dx: number; dy: number; active: boolean; buttons: boolean }

// Lê o controle a cada quadro e chama onFrame. Devolve se há controle conectado.
export function useGamepad(onFrame: (frame: PadFrame) => void): boolean {
  const [padOn, setPadOn] = useState(false)
  const handler = useRef(onFrame)
  handler.current = onFrame

  useEffect(() => {
    const edges = gamepad.createEdges()
    let seen = false
    let raf = 0
    const tick = () => {
      const pad = Array.from(navigator.getGamepads?.() ?? []).find(Boolean)
      if (seen !== !!pad) { seen = !!pad; setPadOn(seen) }
      if (pad) {
        const dpad = gamepad.dpadDirection(pad)
        const stick = gamepad.stickDirection(pad)
        const stickOn = inputMode.stickAllowed(!!(stick.dx || stick.dy))
        const dir = dpad.dx || dpad.dy ? dpad : stickOn ? stick : { dx: 0, dy: 0 }
        handler.current({ fired: edges(pad), down: (b) => !!pad.buttons[b]?.pressed, ...dir, active: padActive(pad), buttons: gamepad.anyButton(pad) })
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return padOn
}
