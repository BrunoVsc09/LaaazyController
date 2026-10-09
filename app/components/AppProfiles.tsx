'use client'

// Aba "Em cada app" da tela Perfis do controle: qual perfil vale em cada card (✕ troca).
import DS4_KEYS from '../../shared/ds4-keys'
import type { Ds4Data } from '../lib/lazy-api'
import type { Sounds } from '../hooks/useSounds'

const LABELS: Record<string, string> = {
  menu: 'Menu (ao abrir o app e ao voltar)',
  games: 'Jogos (padrão; cada jogo pode ter o seu com △ na Biblioteca)',
  desktop: 'Área de trabalho (botão do Início)',
  keyboard: 'Teclado por cima (Share), sem mouse',
}

type Props = { data: Ds4Data; sounds: Sounds; onCycle: (key: string) => void }

export default function AppProfiles({ data, sounds, onCycle }: Props) {
  return (
    <div className="pad-list" role="list">
      {DS4_KEYS.map((k: string) => {
        const value = data.config[k] || ''
        const missing = !!value && !data.profiles.includes(value)
        return (
          <button key={k} type="button" role="listitem" className="pad-row" onClick={() => { sounds.click(); onCycle(k) }}>
            <span>{LABELS[k] ?? k}</span>
            <span className={missing ? 'warn' : ''}>{value ? (missing ? `${value} (não existe)` : value) : 'não mudar'}</span>
            <i />
          </button>
        )
      })}
    </div>
  )
}
