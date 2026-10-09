'use client'

// Boas-vindas, passo 2: nome (✕ no campo abre o teclado) e foto (autoral ou do próprio PC).
import { useEffect, useState } from 'react'
import { ImagePlus } from 'lucide-react'
import FileBrowser from '../FileBrowser'
import { getLazy, type UserProfile, type UserResult } from '../../lib/lazy-api'
import type { Sounds } from '../../hooks/useSounds'

type Props = {
  sounds: Sounds
  profile: UserProfile
  name: string
  onName: (name: string) => void
  onResult: (r: UserResult) => void
}

export default function ProfileStep({ sounds, profile, name, onName, onResult }: Props) {
  const lazy = getLazy()
  const [browse, setBrowse] = useState(false)
  // ○ no navegador de arquivos fecha só ele (a tela principal manda lz:close-modal)
  useEffect(() => {
    const close = () => setBrowse(false)
    window.addEventListener('lz:close-modal', close)
    return () => window.removeEventListener('lz:close-modal', close)
  }, [])
  const tap = (fn: () => void) => () => { sounds.click(); fn() }
  const pickBuiltin = async (id: string) => { if (lazy) onResult(await lazy.user.set({ avatar: { kind: 'builtin', id } })) }
  const pickFile = async (path: string) => { setBrowse(false); if (lazy) onResult(await lazy.user.setPhoto(path)) }
  const pickWindows = async () => { setBrowse(false); if (lazy) onResult(await lazy.user.choosePhoto()) }
  const isOn = (id: string) => profile.avatar?.kind === 'builtin' && profile.avatar.id === id

  return (
    <>
      <h2>Como você quer ser chamado?</h2>
      <p className="welcome-muted">Aparece no topo do Laaazy. Com o controle, aperte ✕ no campo para abrir o teclado.</p>
      <input className="welcome-name" value={name} maxLength={20} onChange={(e) => onName(e.target.value)} placeholder="Seu nome" aria-label="Seu nome" spellCheck={false} />
      <h2 style={{ marginTop: '4vh' }}>Escolha uma foto</h2>
      <div className="welcome-avatars">
        {profile.avatars.map((a) => (
          <button key={a.id} type="button" className={`welcome-avatar ${isOn(a.id) ? 'on' : ''}`} onClick={tap(() => pickBuiltin(a.id))} aria-label={`Foto ${a.id}`}>
            <img src={a.src} alt="" />
          </button>
        ))}
        {profile.avatar?.kind === 'custom' && (
          <button type="button" className="welcome-avatar on" aria-label="Sua foto"><img src={profile.avatarSrc} alt="" /></button>
        )}
        <button type="button" className="welcome-avatar add" onClick={tap(() => setBrowse(true))} aria-label="Escolher do meu PC">
          <ImagePlus size={34} aria-hidden="true" />
        </button>
      </div>
      <p className="welcome-muted">+ escolhe uma foto do seu PC (PNG ou JPG). O Laaazy guarda uma cópia pequena.</p>
      {browse && <FileBrowser mode="image" sounds={sounds} onPick={pickFile} onClose={() => setBrowse(false)} onWindows={pickWindows} />}
    </>
  )
}
