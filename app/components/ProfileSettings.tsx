'use client'

// Configurações → Seu perfil: trocar nome e foto (o mesmo passo das boas-vindas).
// A foto muda na hora; o nome, no "Salvar nome". O topo do Laaazy atualiza junto (lz:user-changed).
import { useEffect, useState } from 'react'
import ProfileStep from './welcome/ProfileStep'
import { nameSaveError } from '../lib/onboarding'
import { getLazy, type UserProfile, type UserResult } from '../lib/lazy-api'
import type { Sounds } from '../hooks/useSounds'

export default function ProfileSettings({ sounds, onMsg }: { sounds: Sounds; onMsg: (msg: string) => void }) {
  const lazy = getLazy()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [name, setName] = useState('')
  useEffect(() => { lazy?.user.get().then((p) => { setProfile(p); setName(p.name) }) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const onResult = (r: UserResult, ok = 'Foto do perfil trocada.') => {
    if (r.profile) { setProfile(r.profile); window.dispatchEvent(new Event('lz:user-changed')) }
    onMsg(r.ok ? ok : r.msg ?? '')
  }
  const saveName = async () => {
    sounds.click()
    if (!profile || !lazy) return
    const err = nameSaveError(profile.name, name)
    if (err) return onMsg(err)
    onResult(await lazy.user.set({ name }), `Nome salvo: ${name.trim()}.`)
  }

  if (!profile) return null
  return (
    <div className="settings-profile">
      <ProfileStep sounds={sounds} profile={profile} name={name} onName={setName} onResult={(r) => onResult(r)} />
      <button type="button" className="ds4-row" onClick={saveName} onMouseEnter={sounds.hover}><span>Salvar nome</span><b>▶</b></button>
    </div>
  )
}
