'use client'

import { useEffect, useRef } from 'react'

const HOVER = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/audio-Hi1CYeB1VQNnJ1e9iUR7e4UO9aoyYv.mp3'
const CLICK = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Dlg%20Yes-fwFGNctIK5xxRioIbyEgUO2NuFOPf7.mp3'

export type Sounds = { hover: () => void; click: () => void }

export function useSounds(): Sounds {
  const audio = useRef<{ hover?: HTMLAudioElement; click?: HTMLAudioElement }>({})
  useEffect(() => {
    audio.current = { hover: new Audio(HOVER), click: new Audio(CLICK) }
  }, [])
  const play = (a?: HTMLAudioElement) => {
    if (!a) return
    a.currentTime = 0
    void a.play().catch(() => undefined)
  }
  return { hover: () => play(audio.current.hover), click: () => play(audio.current.click) }
}
