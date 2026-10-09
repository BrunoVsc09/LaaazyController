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

  // Teste do PS: o próximo aperto (Ctrl+Alt+Home vindo do Laaazy-pad) só confirma, sem fechar nada
  const [psMsg, setPsMsg] = useState('')
  useEffect(() => {
    if (!psMsg.startsWith('Aperte')) return
    const t = window.setTimeout(() => setPsMsg('O PS não chegou. Veja se o controle está conectado e se o Laaazy-pad está aberto (ele abre junto com o Laaazy).'), 15000)
    return () => window.clearTimeout(t)
  }, [psMsg])
  const testPs = async () => {
    if (!lazy) return
    lazy.ps.onTested(() => setPsMsg('✓ O PS está funcionando: o Ctrl+Alt+Home chegou ao Laaazy.'))
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
  const tap = (fn: () => void) => () => { sounds.click(); fn() }

  return (
    <section className="ds4-view" aria-label="Perfis do controle">
      <button className="library-back" onClick={onBack} onMouseEnter={sounds.hover}>‹ Perfis do controle</button>
      <h1>Perfil do controle em cada app</h1>
      <p className="ds4-help">Aperte X numa linha para trocar o perfil. Ele já é aplicado na hora, para você testar, e também ao abrir o card. Ao sair, volta o perfil do Menu. Atalhos no teclado: Ctrl+Alt+Home volta ao menu; Ctrl+Alt+End fecha o que está na frente e volta.</p>
      <p className="ds4-help">Os perfis são do Laaazy-pad, que abre junto com o Laaazy: <b>Jogos</b> (o jogo lê o controle direto; o touchpad move o mouse) e <b>PC</b> (o controle vira mouse: ✕ clica, ○ é o botão direito, Share abre o teclado por cima, L2/R2 mudam o volume). Nos dois, o PS volta ao Início.</p>
      <button className="ds4-row" onClick={tap(testPs)} onMouseEnter={sounds.hover}><span>Testar o botão PS</span><b>▶</b></button>
      {psMsg && <p className="ds4-help" role="status" style={{ color: '#ffd23f' }}>{psMsg}</p>}
      {msg && <p className="ds4-help" style={{ color: '#ffd23f' }}>{msg}</p>}
      {data && data.profiles.length === 0 && <p className="ds4-help">Não achei perfis. Confira a pasta do Laaazy-pad em Configurações (os perfis Jogos e PC aparecem depois que ele abre a primeira vez).</p>}
      {DS4_KEYS.map((k: string) => (
        <button key={k} className="ds4-row" onClick={tap(() => cycle(k))} onMouseEnter={sounds.hover}>
          <span>{k === 'menu' ? 'Menu (ao abrir o app e ao voltar)' : k === 'games' ? 'Jogos (padrão; cada jogo pode ter o seu com △ na Biblioteca)' : k === 'desktop' ? 'Área de trabalho (botão do Início)' : k === 'keyboard' ? 'Teclado por cima (Share), sem mouse' : k}</span><b>{data?.config[k] || 'não mudar'}</b>
        </button>
      ))}
    </section>
  )
}
