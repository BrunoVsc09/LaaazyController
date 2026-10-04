'use client'

import { useEffect, useRef, useState } from 'react'
import gamepad from '../../shared/gamepad'

export type PadFrame = { fired: (button: number) => boolean; dx: number; dy: number }

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
      if (pad) handler.current({ fired: edges(pad), ...gamepad.direction(pad) })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return padOn
}
