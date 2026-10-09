'use client'

// Boas-vindas, passo 3: a cor do Laaazy (muda na hora; dá para trocar depois em Configurações).
import THEMES from '../../../shared/themes'
import { applyTheme } from '../../lib/theme'
import { getLazy } from '../../lib/lazy-api'
import type { Sounds } from '../../hooks/useSounds'

type Props = { sounds: Sounds; theme: string; onTheme: (id: string) => void }

export default function ThemeStep({ sounds, theme, onTheme }: Props) {
  const choose = (id: string) => {
    sounds.click()
    applyTheme(id)
    void getLazy()?.settings.set('theme', id)
    onTheme(id)
  }
  return (
    <>
      <h2>Escolha a cor do seu Laaazy</h2>
      <p className="welcome-muted">Muda na hora. Dá para trocar depois em Configurações → Cor do Laaazy.</p>
      <div className="welcome-themes" style={{ marginTop: 18 }}>
        {THEMES.map((t) => (
          <button key={t.id} type="button" data-t={t.id} className={`welcome-theme ${theme === t.id ? 'on' : ''}`} onClick={() => choose(t.id)} onMouseEnter={sounds.hover}>
            {t.label}
          </button>
        ))}
      </div>
    </>
  )
}
