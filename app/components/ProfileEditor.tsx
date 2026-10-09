'use client'

// Editor de um perfil do Laaazy-pad: controle desenhado, lista de botões e painel de edição.
// Os comandos fixos do Laaazy (PS; no PC também Share e L2/R2) aparecem, mas não mudam.
import { useEffect, useState } from 'react'
import ControllerArt from './ControllerArt'
import PadEditPanel from './PadEditPanel'
import { useGamepad } from '../hooks/useGamepad'
import { actionLabel, padButtonAt } from '../lib/pad-editor'
import { getLazy, type PadAction, type PadProfile } from '../lib/lazy-api'
import type { Sounds } from '../hooks/useSounds'

type Props = { name: string; sounds: Sounds; onMsg: (msg: string) => void }
const CAPTURE_MS = 10000

export default function ProfileEditor({ name, sounds, onMsg }: Props) {
  const lazy = getLazy()
  const [profile, setProfile] = useState<PadProfile | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [capture, setCapture] = useState(false)

  useEffect(() => {
    setProfile(null)
    lazy?.ds4.profile(name).then((r) => { if (r.ok && r.profile) setProfile(r.profile); else onMsg(r.msg ?? '') })
  }, [name]) // eslint-disable-line react-hooks/exhaustive-deps

  // "Aperte um botão no controle": o primeiro apertado é escolhido (por até 10 s)
  useEffect(() => {
    if (!capture) return
    const t = window.setTimeout(() => setCapture(false), CAPTURE_MS)
    return () => window.clearTimeout(t)
  }, [capture])
  useGamepad(({ fired }) => {
    if (!capture) return
    for (let i = 0; i <= 17; i++) {
      const id = fired(i) ? padButtonAt(i) : null
      if (id) { setSelected(id); setCapture(false); sounds.click(); return }
    }
  })

  const save = async (action: PadAction) => {
    if (!lazy || !selected) return
    const r = await lazy.ds4.setButton(name, selected, action)
    if (r.profile) setProfile(r.profile)
    onMsg(r.msg ?? '')
  }

  const tap = (fn: () => void) => () => { sounds.click(); fn() }
  const button = profile?.buttons.find((b) => b.id === selected) ?? null
  const locked = profile?.buttons.filter((b) => b.locked).map((b) => b.id) ?? []
  if (!profile) return <p className="pad-hint">Abrindo o perfil {name}...</p>

  return (
    <div className="pad-editor">
      <div className="pad-left">
        <ControllerArt selected={selected} locked={locked} onPick={(id) => { sounds.click(); setSelected(id) }} />
        <button type="button" className={`pad-opt pad-detect ${capture ? 'on' : ''}`} onClick={tap(() => setCapture((c) => !c))}>
          {capture ? 'Aperte um botão no controle agora...' : 'Escolher apertando o botão no controle'}
        </button>
        {capture && <span data-pad-capture hidden />}
        {button ? <PadEditPanel button={button} onSave={save} sounds={sounds} /> : <p className="pad-hint">Escolha um botão na lista ou no controle para editá-lo.</p>}
      </div>
      <div className="pad-list" role="list">
        <div className="pad-row ro"><span>Analógico esq.</span><span>{profile.sticks.esquerdo}</span><i>●</i></div>
        <div className="pad-row ro"><span>Analógico dir.</span><span>{profile.sticks.direito}</span><i>●</i></div>
        <div className="pad-row ro"><span>Touchpad (deslizar)</span><span>{profile.sticks.touchpad}</span><i>●</i></div>
        {profile.buttons.map((b) => (
          <button key={b.id} type="button" role="listitem" className={`pad-row ${b.locked ? 'locked' : ''} ${selected === b.id ? 'sel' : ''}`}
            onClick={tap(() => setSelected(b.id))}>
            <span>{b.label}</span><span>{actionLabel(b.action)}</span><i>{b.locked ? '●' : ''}</i>
          </button>
        ))}
      </div>
    </div>
  )
}
