'use client'

import { useEffect, useState } from 'react'
import { Gamepad2, Power, Settings } from 'lucide-react'
import { displayUser, formatClock } from '../lib/header-info'
import { getLazy } from '../lib/lazy-api'
import type { Sounds } from '../hooks/useSounds'

type Props = { sounds: Sounds; onController: () => void; onSettings: () => void; onPower: () => void }

export default function Header({ sounds, onController, onSettings, onPower }: Props) {
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
      <time>{now ? formatClock(now) : ''}</time>
    </header>
  )
}
