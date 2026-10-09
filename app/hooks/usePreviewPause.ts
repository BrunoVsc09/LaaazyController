'use client'

// Start no Início pausa a prévia do destaque; apertar de novo continua. Trocar de prévia despausa.
import { useEffect, useRef, useState } from 'react'
import { startPress } from '../lib/trailer'

export function usePreviewPause(send: (func: string) => void, preview: string | null): boolean {
  const [paused, setPaused] = useState(false)
  const now = useRef({ send, preview, paused })
  now.current = { send, preview, paused }
  useEffect(() => { setPaused(false) }, [preview])
  useEffect(() => {
    const onStart = () => {
      const r = startPress({ playing: !!now.current.preview, paused: now.current.paused })
      if (r.command) now.current.send(r.command)
      setPaused(r.paused)
    }
    window.addEventListener('lz:start', onStart)
    return () => window.removeEventListener('lz:start', onStart)
  }, [])
  return paused
}
