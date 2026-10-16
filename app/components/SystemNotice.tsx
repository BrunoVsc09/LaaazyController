'use client'

import { idleWarningText } from '../lib/idle-shutdown'

type Props = { alert: string; idleSeconds: number }

// Faixa por cima da tela: o aviso de desligar o PC sem uso tem a vez; senão, o de bateria baixa
export default function SystemNotice({ alert, idleSeconds }: Props) {
  const text = idleSeconds > 0 ? idleWarningText(idleSeconds) : alert
  if (!text) return null
  return <div className={`lz-notice ${idleSeconds > 0 ? 'urgent' : ''}`} role="alert">{text}</div>
}
