'use client'

import { useEffect, useState } from 'react'
import { getLazy, type PadBattery } from '../lib/lazy-api'

const ALERT_MS = 10_000 // o aviso de bateria baixa some sozinho

// Bateria do controle (a cada 5 s), aviso de bateria baixa e os segundos até o PC desligar sem
// uso (0 = sem aviso). Uma assinatura só: o preload guarda um ouvinte por canal.
export function usePadStatus() {
  const [battery, setBattery] = useState<PadBattery>(null)
  const [alert, setAlert] = useState('')
  const [idleSeconds, setIdleSeconds] = useState(0)
  useEffect(() => {
    const lazy = getLazy()
    if (!lazy) return
    let timer = 0
    lazy.onPadStatus((s) => {
      setBattery(s.battery)
      if (!s.alert) return
      setAlert(s.alert)
      window.clearTimeout(timer)
      timer = window.setTimeout(() => setAlert(''), ALERT_MS)
    })
    lazy.onIdleWarning((w) => setIdleSeconds(w.seconds))
    return () => window.clearTimeout(timer)
  }, [])
  return { battery, alert, idleSeconds }
}
