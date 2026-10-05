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

  // Teste do PS: o próximo aperto (F24 vindo do DS4Windows) só confirma, sem fechar nada
  const [psMsg, setPsMsg] = useState('')
  useEffect(() => {
    if (!psMsg.startsWith('Aperte')) return
    const t = window.setTimeout(() => setPsMsg('O PS não chegou. No DS4Windows, mapeie o botão PS para a tecla F24 em TODOS os perfis que você usa (Menu, PC, jogos).'), 15000)
    return () => window.clearTimeout(t)
  }, [psMsg])
  const testPs = async () => {
    if (!lazy) return
    lazy.ps.onTested(() => setPsMsg('✓ O PS está funcionando: o F24 chegou ao Laaazy.'))
    await lazy.ps.startTest()
    setPsMsg('Aperte o botão PS do controle agora (você tem 15 segundos)...')
  }

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
      <p className="ds4-help">Teclado por cima do Edge (busca e senhas nos streamings): no DS4Windows, mapeie um botão (ex.: Share ou touchpad) para a tecla F19 em todos os perfis. No teclado: Ctrl+Alt+K.</p>
      <button className="ds4-row" onClick={tap(testPs)} onMouseEnter={sounds.hover}><span>Testar o botão PS</span><b>▶</b></button>
      {psMsg && <p className="ds4-help" role="status" style={{ color: '#ffd23f' }}>{psMsg}</p>}
      <button className="ds4-row" onClick={tap(openDs4)} onMouseEnter={sounds.hover}><span>Abrir o DS4Windows</span><b>▶</b></button>
      {msg && <p className="ds4-help" style={{ color: '#ffd23f' }}>{msg}</p>}
      {data && data.profiles.length === 0 && <p className="ds4-help">Não achei perfis. Confira a pasta do DS4Windows em Configurações, salve pelo menos um perfil no DS4Windows e volte aqui.</p>}
      {DS4_KEYS.map((k: string) => (
        <button key={k} className="ds4-row" onClick={tap(() => cycle(k))} onMouseEnter={sounds.hover}>
          <span>{k === 'menu' ? 'Menu (ao abrir o app e ao voltar)' : k === 'games' ? 'Jogos (padrão; cada jogo pode ter o seu com △ na Biblioteca)' : k}</span><b>{data?.config[k] || 'não mudar'}</b>
        </button>
      ))}
    </section>
  )
}
