'use client'

// Perfis do controle: editar os perfis do Laaazy-pad (sem tirar os comandos fixos do Laaazy) e
// escolher qual perfil vale em cada app. Preto, estilo Hydra (pedido do Bruno, 2026-10-09).
import { useEffect, useState } from 'react'
import gamepad from '../../shared/gamepad'
import AppProfiles from '../components/AppProfiles'
import ProfileEditor from '../components/ProfileEditor'
import { useGamepad } from '../hooks/useGamepad'
import { nextProfile } from '../lib/pad-editor'
import { getLazy, type Ds4Data } from '../lib/lazy-api'
import type { Sounds } from '../hooks/useSounds'

type Props = { onBack: () => void; sounds: Sounds }
const APPS = 'Em cada app'

export default function Ds4Screen({ onBack, sounds }: Props) {
  const lazy = getLazy()
  const [data, setData] = useState<Ds4Data | null>(null)
  const [tab, setTab] = useState('')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    lazy?.ds4.get().then((d) => {
      setData(d)
      setTab(d.profiles.includes(d.current ?? '') ? d.current! : d.profiles[0] ?? APPS)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Teste do PS: o próximo aperto (Ctrl+Alt+Home vindo do Laaazy-pad) só confirma, sem fechar nada
  const [psMsg, setPsMsg] = useState('')
  useEffect(() => {
    if (!psMsg.startsWith('Aperte')) return
    const t = window.setTimeout(() => setPsMsg('O PS não chegou. Veja se o controle está conectado e se o Laaazy-pad está aberto.'), 15000)
    return () => window.clearTimeout(t)
  }, [psMsg])
  const testPs = async () => {
    if (!lazy) return
    lazy.ps.onTested(() => setPsMsg('✓ O PS está funcionando.'))
    await lazy.ps.startTest()
    setPsMsg('Aperte o botão PS do controle agora (15 segundos)...')
  }

  const tabs = [...(data?.profiles ?? []), APPS]
  // L1/R1 trocam a aba (menos quando o editor está esperando um botão do controle)
  useGamepad(({ fired }) => {
    if (document.querySelector('[data-pad-capture]')) return
    const step = fired(gamepad.BTN.R1) ? 1 : fired(gamepad.BTN.L1) ? -1 : 0
    if (step) { sounds.click(); setTab((t) => nextProfile(tabs, t, step)) }
  })

  const cycle = async (key: string) => {
    if (!data || !lazy) return
    const options = ['', ...data.profiles]
    const next = options[(options.indexOf(data.config[key] ?? '') + 1) % options.length]
    setData({ ...data, config: { ...data.config, [key]: next } })
    setMsg((await lazy.ds4.set(key, next)).msg)
  }
  const tap = (fn: () => void) => () => { sounds.click(); fn() }
  const status = !data ? '' : !data.cmd ? 'Laaazy-pad não encontrado' : data.current ? `Laaazy-pad aberto · agora: ${data.current}` : 'Laaazy-pad fechado'

  return (
    <section className="pad-view" aria-label="Perfis do controle">
      <header className="pad-top">
        <button type="button" className="pad-back" onClick={onBack} onMouseEnter={sounds.hover}>‹</button>
        <h1>Perfis do controle</h1>
        {status && <span className={`pad-status ${data?.current ? 'on' : ''}`}>{status}</span>}
        <nav className="pad-tabs">
          {tabs.map((t) => (
            <button key={t} type="button" className={`pad-tab ${tab === t ? 'on' : ''}`} onClick={tap(() => setTab(t))}>{t}</button>
          ))}
          <button type="button" className="pad-tab" onClick={tap(testPs)}>Testar o PS</button>
        </nav>
      </header>
      {(psMsg || msg) && <p className="pad-msg" role="status">{psMsg || msg}</p>}
      {data && data.profiles.length === 0 && <p className="pad-hint">Não achei perfis. Confira a pasta do Laaazy-pad em Configurações.</p>}
      {tab === APPS && data && <AppProfiles data={data} sounds={sounds} onCycle={cycle} />}
      {tab && tab !== APPS && <ProfileEditor key={tab} name={tab} sounds={sounds} onMsg={setMsg} />}
      <footer className="pad-foot">
        <span>✕ Escolher</span><span>○ Voltar</span><span>L1/R1 Trocar perfil</span><span>● Fixo do Laaazy</span>
      </footer>
    </section>
  )
}
