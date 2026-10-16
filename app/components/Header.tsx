'use client'

import { useEffect, useState } from 'react'
import { BatteryCharging, BatteryFull, BatteryLow, BatteryMedium, Gamepad2, Power, Settings } from 'lucide-react'
import { displayUser, formatClock } from '../lib/header-info'
import { batteryView, type BatteryLevel } from '../lib/pad-battery'
import { getLazy, type PadBattery } from '../lib/lazy-api'
import type { Sounds } from '../hooks/useSounds'

type Props = { sounds: Sounds; battery: PadBattery; onController: () => void; onSettings: () => void; onPower: () => void }
const BATTERY_ICON: Record<BatteryLevel, typeof BatteryFull> = { full: BatteryFull, medium: BatteryMedium, low: BatteryLow, charging: BatteryCharging }

export default function Header({ sounds, battery, onController, onSettings, onPower }: Props) {
  // Hora e usuário só no cliente: o HTML é gerado no build, sem hora nem usuário
  const [now, setNow] = useState<Date | null>(null)
  const [user, setUser] = useState({ name: '', initial: '', src: '' })
  useEffect(() => {
    setNow(new Date())
    const t = window.setInterval(() => setNow(new Date()), 10000)
    // Nome e foto do perfil (boas-vindas); atualiza quando o perfil muda
    const load = () => getLazy()?.user.get().then((u) => setUser({ ...displayUser(u.name), src: u.avatarSrc }))
    load()
    window.addEventListener('lz:user-changed', load)
    return () => { window.clearInterval(t); window.removeEventListener('lz:user-changed', load) }
  }, [])

  const bat = batteryView(battery)
  const BatIcon = bat && BATTERY_ICON[bat.level]
  const actions = [
    { label: 'Perfis do controle', Icon: Gamepad2, run: onController },
    { label: 'Configurações', Icon: Settings, run: onSettings },
    { label: 'Energia', Icon: Power, run: onPower },
  ]
  return (
    <header className="ps4-header">
      <div className="ps4-user">{user.name && <><div className="crash-avatar">{user.src ? <img src={user.src} alt="" /> : user.initial}</div><strong>{user.name}</strong></>}</div>
      <nav className="ps4-icons" aria-label="Ações do sistema">
        {actions.map(({ label, Icon, run }) => (
          <button key={label} type="button" aria-label={label} title={label} onClick={() => { sounds.click(); run() }} onMouseEnter={sounds.hover}>
            <Icon />
          </button>
        ))}
      </nav>
      <div className="ps4-status">
        {bat && BatIcon && <span className={`ps4-battery ${bat.level}`} title={bat.title} aria-label={bat.title}><BatIcon aria-hidden />{bat.text}</span>}
        <time>{now ? formatClock(now) : ''}</time>
      </div>
    </header>
  )
}
