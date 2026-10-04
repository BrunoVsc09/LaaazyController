'use client'

import { useEffect, useState } from 'react'
import streaming from '../../shared/streaming'
import ApiKeySection from '../components/ApiKeySection'
import { nextMinutes } from '../lib/screensaver'
import { getLazy, type DrmStatus, type StreamMode } from '../lib/lazy-api'
import type { Sounds } from '../hooks/useSounds'

type Props = { onBack: () => void; sounds: Sounds }
const MODE_LABEL: Record<StreamMode, string> = { app: 'No app', edge: 'No Edge (tela cheia)' }

export default function SettingsScreen({ onBack, sounds }: Props) {
  const lazy = getLazy()
  const [msg, setMsg] = useState('')
  const [paths, setPaths] = useState({ edge: '', ds4windows: '' })
  const [closeDs4, setCloseDs4] = useState(true)
  const [modes, setModes] = useState<Record<string, StreamMode>>({})
  const [drm, setDrm] = useState<DrmStatus | null>(null)
  const [tmdbOn, setTmdbOn] = useState(false)
  const [atLogin, setAtLogin] = useState(false)
  const [saverMin, setSaverMin] = useState(10)
  const [gridOn, setGridOn] = useState(false)

  useEffect(() => {
    if (!lazy) return
    lazy.settings.get().then((s) => { setCloseDs4(s.closeDs4OnMenu); setModes(s.streamModes); setSaverMin(s.screensaverMinutes ?? 10) })
    Promise.all([lazy.exe.get('edge'), lazy.exe.get('ds4windows')]).then(([edge, ds4windows]) => setPaths({ edge, ds4windows }))
    lazy.drm.status().then(setDrm)
    lazy.catalog.status().then((s) => setTmdbOn(s.configured))
    lazy.covers.status().then((s) => setGridOn(s.configured))
    lazy.power.openAtLogin().then(setAtLogin)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const choose = async (key: 'edge' | 'ds4windows', label: string) => {
    const p = await lazy?.exe.choose(key)
    if (p) { setPaths((cur) => ({ ...cur, [key]: p })); setMsg(`Pasta do ${label} salva.`) }
  }
  const toggleClose = () => {
    const v = !closeDs4
    setCloseDs4(v)
    lazy?.settings.set('closeDs4OnMenu', v)
    setMsg(v ? 'Ao apertar PS, o DS4Windows será fechado.' : 'O DS4Windows continuará aberto ao apertar PS.')
  }
  const cycleSaver = () => {
    const m = nextMinutes(saverMin)
    setSaverMin(m)
    lazy?.settings.set('screensaverMinutes', m)
    setMsg(m ? `Proteção de tela depois de ${m} minutos parado.` : 'Proteção de tela desligada.')
  }
  const toggleLogin = () => {
    const v = !atLogin
    setAtLogin(v)
    lazy?.power.setOpenAtLogin(v)
    setMsg(v ? 'O Laaazy vai abrir junto com o Windows.' : 'O Laaazy não vai mais abrir junto com o Windows.')
  }
  const toggleMode = (label: string, current: StreamMode) => {
    const next: StreamMode = current === 'app' ? 'edge' : 'app'
    const all = { ...modes, [label]: next }
    setModes(all)
    lazy?.settings.set('streamModes', all)
    setMsg(`${label} vai abrir ${next === 'app' ? 'dentro do app' : 'no Edge em tela cheia'}.`)
  }
  const tap = (fn: () => void) => () => { sounds.click(); fn() }

  return (
    <section className="ds4-view settings-view" aria-label="Configurações">
      <button className="library-back" onClick={onBack} onMouseEnter={sounds.hover}>‹ Configurações</button>
      <h1>Configurações</h1>
      {msg && <p className="ds4-help" style={{ color: '#ffd23f' }}>{msg}</p>}
      <button className="ds4-row" onClick={tap(() => choose('edge', 'Edge'))} onMouseEnter={sounds.hover}><span>Pasta do Edge</span><b>{paths.edge || 'não encontrado, toque para escolher'}</b></button>
      <button className="ds4-row" onClick={tap(() => choose('ds4windows', 'DS4Windows'))} onMouseEnter={sounds.hover}><span>Pasta do DS4Windows</span><b>{paths.ds4windows || 'não encontrado, toque para escolher'}</b></button>
      <button className="ds4-row" onClick={tap(toggleClose)} onMouseEnter={sounds.hover}><span>Fechar o DS4Windows ao apertar PS</span><b>{closeDs4 ? 'Sim' : 'Não'}</b></button>
      <button className="ds4-row" onClick={tap(cycleSaver)} onMouseEnter={sounds.hover}><span>Proteção de tela</span><b>{saverMin ? `${saverMin} min` : 'Desligada'}</b></button>
      <button className="ds4-row" onClick={tap(toggleLogin)} onMouseEnter={sounds.hover}><span>Abrir junto com o Windows</span><b>{atLogin ? 'Sim' : 'Não'}</b></button>
      <ApiKeySection
        title="Filmes e séries (TMDB)" configured={tmdbOn} sounds={sounds}
        help='Para o Início mostrar filmes e séries. Crie uma chave grátis em themoviedb.org → Configurações → API e cole o "API Read Access Token" (X no campo abre o teclado).'
        note="Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB."
        onSave={(k) => lazy!.catalog.setKey(k)} onClear={() => lazy!.catalog.clearKey()}
        onResult={(m, on) => { setMsg(m); setTmdbOn(on) }}
      />
      <ApiKeySection
        title="Capas dos jogos (SteamGridDB)" configured={gridOn} sounds={sounds}
        help="Para jogos da Epic e do PC ganharem capa. Crie uma chave grátis em steamgriddb.com → Preferências → API e cole aqui."
        onSave={(k) => lazy!.covers.setKey(k)} onClear={() => lazy!.covers.clearKey()}
        onResult={(m, on) => { setMsg(m); setGridOn(on) }}
      />
      <h2 className="ds4-help">Onde abrir cada serviço</h2>
      <p className="ds4-help">{drm ? drm.msg : 'Verificando o Widevine (DRM)...'} Se um vídeo não tocar dentro do app, troque o serviço para o Edge.</p>
      {streaming.map((s) => {
        const mode = modes[s.label] ?? (s.mode as StreamMode)
        return (
          <button key={s.label} className="ds4-row" onClick={tap(() => toggleMode(s.label, mode))} onMouseEnter={sounds.hover}>
            <span>{s.label}</span><b>{MODE_LABEL[mode]}</b>
          </button>
        )
      })}
    </section>
  )
}
