'use client'

// Menu do jogo na Biblioteca: △ do controle ou botão direito do mouse.
// Perfil do controle do jogo, ou remover da Biblioteca (com confirmação; ✕ escolhe, ○ fecha).
import { useEffect, useState } from 'react'
import { removeNote } from '../lib/library-filter'
import type { Ds4Data, Game } from '../lib/lazy-api'
import type { Sounds } from '../hooks/useSounds'

type Step = 'menu' | 'profile' | 'confirm'
type Props = {
  game: Game; ds4: Ds4Data | null; profile: string; sounds: Sounds
  onProfile: (profile: string) => void; onRemove: () => void; onClose: () => void
}

export default function GameMenu({ game, ds4, profile, sounds, onProfile, onRemove, onClose }: Props) {
  const [step, setStep] = useState<Step>('menu')
  // Cada passo começa com a borda no primeiro botão; na confirmação, no Cancelar (✕ apertado sem querer não remove)
  useEffect(() => {
    const buttons = document.querySelectorAll<HTMLElement>('.lz-picker button')
    buttons[step === 'confirm' ? buttons.length - 1 : 0]?.focus()
  }, [step])
  const tap = (fn: () => void) => () => { sounds.click(); fn() }

  return (
    <div className="lz-picker power-menu" data-modal role="dialog" aria-label={game.name}>
      {step === 'menu' && (
        <>
          <p><strong>{game.name}</strong><br />{game.platform}</p>
          <button type="button" className="lz-btn" onClick={tap(() => setStep('profile'))}>🎮 Perfil do controle{profile ? ` (${profile})` : ''}</button>
          <button type="button" className="lz-btn" onClick={tap(() => setStep('confirm'))}>🗑 Remover da Biblioteca</button>
        </>
      )}
      {step === 'profile' && (
        <>
          <p><strong>Perfil do controle</strong><br />{game.name}</p>
          {['', ...(ds4?.profiles ?? [])].map((p) => (
            <button key={p || '(padrão)'} type="button" className="lz-btn" onClick={tap(() => onProfile(p))}>
              {profile === p ? '✓ ' : ''}{p || `Padrão dos jogos${ds4?.config.games ? ` (${ds4.config.games})` : ' (não mudar)'}`}
            </button>
          ))}
          {ds4 && ds4.profiles.length === 0 && <p>Nenhum perfil achado. Confira a pasta do Laaazy-pad em Configurações.</p>}
        </>
      )}
      {step === 'confirm' && (
        <>
          <p><strong>Remover da Biblioteca?</strong><br />{removeNote(game)}</p>
          <button type="button" className="lz-btn primary" onClick={tap(onRemove)}>Remover</button>
        </>
      )}
      <button type="button" className="lz-btn" onClick={tap(onClose)}>Cancelar</button>
    </div>
  )
}
