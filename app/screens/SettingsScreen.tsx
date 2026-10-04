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

  useEffect(() => {
    if (!lazy) return
    lazy.settings.get().then((s) => { setCloseDs4(s.closeDs4OnMenu); setModes(s.streamModes) })
    Promise.all([lazy.exe.get('edge'), lazy.exe.get('ds4windows')]).then(([edge, ds4windows]) => setPaths({ edge, ds4windows }))
    lazy.drm.status().then(setDrm)
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
