'use client'

import { useEffect } from 'react'
import { getLazy } from '../lib/lazy-api'
import { zoomFor } from '../lib/screen-scale'

// Evento que as Configurações e a janelinha "Aa" mandam quando o tamanho muda (detail = %)
export const SCREEN_SCALE_EVENT = 'lz:screen-scale'

const apply = (v: number) => {
  const z = zoomFor(v)
  document.documentElement.style.zoom = z
  document.documentElement.style.setProperty('--lz-zoom', z) // as janelas de tela cheia desfazem o zoom
}

// Tamanho do Laaazy: o salvo ao abrir e o novo na hora em que muda
export function useScreenScale() {
  useEffect(() => {
    getLazy()?.settings.get().then((s) => apply(s.screenScale ?? 100))
    const onChange = (e: Event) => apply(Number((e as CustomEvent<number>).detail))
    window.addEventListener(SCREEN_SCALE_EVENT, onChange)
    return () => window.removeEventListener(SCREEN_SCALE_EVENT, onChange)
  }, [])
}

// Grava e aplica na hora (Configurações e "Aa")
export function setScreenScale(v: number) {
  getLazy()?.settings.set('screenScale', v)
  window.dispatchEvent(new CustomEvent(SCREEN_SCALE_EVENT, { detail: v }))
}
