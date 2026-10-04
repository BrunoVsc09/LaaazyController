'use client'

import { useEffect, useState } from 'react'
import DS4_KEYS from '../../shared/ds4-keys'
import { getLazy, type Ds4Data } from '../lib/lazy-api'
import type { Sounds } from '../hooks/useSounds'

type Props = { onBack: () => void; sounds: Sounds }

export default function Ds4Screen({ onBack, sounds }: Props) {
  const lazy = getLazy()
  const [data, setData] = useState<Ds4Data | null>(null)
  const [msg, setMsg] = useState('')

  useEffect(() => { lazy?.ds4.get().then(setData) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const options = ['', ...(data?.profiles ?? [])]
  const cycle = async (key: string) => {
    if (!data || !lazy) return
    const next = options[(options.indexOf(data.config[key] ?? '') + 1) % options.length]
    setData({ ...data, config: { ...data.config, [key]: next } })
    setMsg((await lazy.ds4.set(key, next)).msg)
  }
  const openDs4 = async () => { setMsg('Abrindo...'); setMsg((await lazy?.launch('ds4windows')) || 'DS4Windows aberto.') }
  const tap = (fn: () => void) => () => { sounds.click(); fn() }

  return (
    <section className="ds4-view" aria-label="Perfis do controle">
      <button className="library-back" onClick={onBack} onMouseEnter={sounds.hover}>‹ Perfis do controle</button>
      <h1>Perfil do controle em cada app</h1>
      <p className="ds4-help">Aperte X numa linha para trocar o perfil. Ele já é aplicado na hora, para você testar, e também ao abrir o card. Ao sair, volta o perfil do Menu. Atalhos no teclado: Ctrl+Alt+Home volta ao menu; Ctrl+Alt+End fecha o que está na frente e volta.</p>
      <button className="ds4-row" onClick={tap(openDs4)} onMouseEnter={sounds.hover}><span>Abrir o DS4Windows</span><b>▶</b></button>
      {msg && <p className="ds4-help" style={{ color: '#ffd23f' }}>{msg}</p>}
      {data && data.profiles.length === 0 && <p className="ds4-help">Não achei perfis. Confira a pasta do DS4Windows em Configurações, salve pelo menos um perfil no DS4Windows e volte aqui.</p>}
      {DS4_KEYS.map((k: string) => (
        <button key={k} className="ds4-row" onClick={tap(() => cycle(k))} onMouseEnter={sounds.hover}>
          <span>{k === 'menu' ? 'Menu (ao abrir o app e ao voltar)' : k}</span><b>{data?.config[k] || 'não mudar'}</b>
        </button>
      ))}
    </section>
  )
}
