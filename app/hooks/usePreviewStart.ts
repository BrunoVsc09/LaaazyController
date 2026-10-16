'use client'

// A prévia do destaque só aparece quando o vídeo começa a tocar (o YouTube às vezes recusa o vídeo
// sem avisar e mostraria "Vídeo indisponível"). Sem começar em TRAILER_START_MS, chama onStuck.
import { useEffect, useRef, useState } from 'react'
import { TRAILER_START_MS } from '../lib/trailer'

export function usePreviewStart(preview: string | null, onStuck: () => void): [boolean, () => void] {
  const [started, setStarted] = useState(false)
  const stuck = useRef(onStuck)
  stuck.current = onStuck
  const startedNow = useRef(false)

  useEffect(() => {
    setStarted(false)
    startedNow.current = false
    if (!preview) return
    const t = window.setTimeout(() => { if (!startedNow.current) stuck.current() }, TRAILER_START_MS)
    return () => window.clearTimeout(t)
  }, [preview])

  const markStarted = () => { startedNow.current = true; setStarted(true) }
  return [started, markStarted]
}
