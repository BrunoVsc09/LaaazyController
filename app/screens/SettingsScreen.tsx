'use client'

import { useEffect, useState } from 'react'
import streaming from '../../shared/streaming'
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
  const [tmdbKey, setTmdbKey] = useState('')

  useEffect(() => {
    if (!lazy) return
    lazy.settings.get().then((s) => { setCloseDs4(s.closeDs4OnMenu); setModes(s.streamModes) })
    Promise.all([lazy.exe.get('edge'), lazy.exe.get('ds4windows')]).then(([edge, ds4windows]) => setPaths({ edge, ds4windows }))
    lazy.drm.status().then(setDrm)
    lazy.catalog.status().then((s) => setTmdbOn(s.configured))
    lazy.power.openAtLogin().then(setAtLogin)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // A chave só passa pela tela uma vez: vai para o Electron, que testa e guarda criptografada
  const saveTmdb = async () => {
    if (!lazy) return
    setMsg('Testando a chave no TMDB...')
    const r = await lazy.catalog.setKey(tmdbKey)
    setMsg(r.msg)
    if (r.ok) { setTmdbKey(''); setTmdbOn(true) }
  }
  const clearTmdb = async () => {
    if (!lazy) return
    setMsg((await lazy.catalog.clearKey()).msg)
    setTmdbOn(false)
  }

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
      <button className="ds4-row" onClick={tap(toggleLogin)} onMouseEnter={sounds.hover}><span>Abrir junto com o Windows</span><b>{atLogin ? 'Sim' : 'Não'}</b></button>
      <h2 className="ds4-help">Filmes e séries (TMDB)</h2>
      <p className="ds4-help">
        {tmdbOn ? 'Chave do TMDB configurada.' : 'Sem chave: o Início não mostra filmes e séries.'} Crie uma chave grátis em themoviedb.org → Configurações → API e cole o &quot;API Read Access Token&quot; abaixo (use o teclado).
      </p>
      <label className="ds4-row" style={{ cursor: 'text' }}>
        <span>Chave do TMDB</span>
        <input
          type="password" autoComplete="off" spellCheck={false} value={tmdbKey}
          onChange={(e) => setTmdbKey(e.target.value)}
          placeholder={tmdbOn ? 'colar outra chave para trocar' : 'colar aqui'}
          style={{ flex: 1, marginLeft: 24, background: 'transparent', border: 0, color: 'inherit', font: 'inherit', textAlign: 'right' }}
        />
      </label>
      <button className="ds4-row" onClick={tap(saveTmdb)} onMouseEnter={sounds.hover} disabled={!tmdbKey.trim()}><span>Salvar e testar a chave</span><b>▶</b></button>
      {tmdbOn && <button className="ds4-row" onClick={tap(clearTmdb)} onMouseEnter={sounds.hover}><span>Remover a chave do TMDB</span><b>✕</b></button>}
      <p className="ds4-help" style={{ fontSize: '0.85em', opacity: 0.8 }}>Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB.</p>
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
