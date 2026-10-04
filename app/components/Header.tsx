'use client'

import { Gamepad2, Headphones, Mail, Power, Settings, Smile, Trophy } from 'lucide-react'
import type { Sounds } from '../hooks/useSounds'

export default function Header({ sounds }: { sounds: Sounds }) {
  const icons = [
    { label: 'Controle', Icon: Gamepad2 },
    { label: 'Mensagens', Icon: Mail, badge: 2 },
    { label: 'Perfil', Icon: Smile },
    { label: 'Headset', Icon: Headphones },
    { label: 'Trofeus', Icon: Trophy },
    { label: 'Configuracoes', Icon: Settings },
    { label: 'Energia', Icon: Power },
  ]
  return (
    <header className="ps4-header">
      <div className="ps4-user"><div className="crash-avatar">B</div><strong>Bruno</strong></div>
      <nav className="ps4-icons" aria-label="Ações do sistema">
        {icons.map(({ label, Icon, badge }) => (
          <button key={label} type="button" className={badge ? 'icon-with-badge' : undefined} aria-label={label} onClick={sounds.click} onMouseEnter={sounds.hover}>
            <Icon />{badge && <b>{badge}</b>}
          </button>
        ))}
      </nav>
      <time>14:38</time>
    </header>
  )
}
