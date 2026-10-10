'use client'

import { useEffect, useState } from 'react'
import streaming from '../../shared/streaming'
import ApiKeySection from '../components/ApiKeySection'
import ProfileSettings from '../components/ProfileSettings'
import { nextMinutes } from '../lib/screensaver'
import { getLazy, type DrmStatus, type StreamMode } from '../lib/lazy-api'
import { DEFAULT_THEME, applyTheme, nextTheme, themeLabel, themeOf } from '../lib/theme'
import type { Sounds } from '../hooks/useSounds'

type Props = { onBack: () => void; sounds: Sounds }
const MODE_LABEL: Record<StreamMode, string> = { app: 'No app', edge: 'No Edge (tela cheia)' }

export default function SettingsScreen({ onBack, sounds }: Props) {
  const lazy = getLazy()
  const [msg, setMsg] = useState('')
  const [paths, setPaths] = useState({ edge: '', laaazypad: '' })
  const [modes, setModes] = useState<Record<string, StreamMode>>({})
  const [drm, setDrm] = useState<DrmStatus | null>(null)
  const [tmdbOn, setTmdbOn] = useState(false)
  const [atLogin, setAtLogin] = useState(false)
  const [psCloses, setPsCloses] = useState(true)
  const [trailerOn, setTrailerOn] = useState(true)
  const [lockOn, setLockOn] = useState(true)
  const [noGpu, setNoGpu] = useState<string[]>([])
  const [saverMin, setSaverMin] = useState(10)
  const [gridOn, setGridOn] = useState(false)
  const [ytOn, setYtOn] = useState(false)
  const [ytLeft, setYtLeft] = useState(90)
  const [aiOn, setAiOn] = useState(false)
  const [aiLeft, setAiLeft] = useState(0)
  const [aiModel, setAiModel] = useState('')

  useEffect(() => {
    if (!lazy) return
    lazy.settings.get().then((s) => { setTheme(themeOf(s.theme)); setModes(s.streamModes); setSaverMin(s.screensaverMinutes ?? 10); setPsCloses(s.psClosesApp !== false); setTrailerOn(s.trailerPreview !== false); setLockOn(s.lockCursor !== false); setNoGpu(s.edgeNoGpu ?? []) })
    Promise.all([lazy.exe.get('edge'), lazy.exe.get('laaazypad')]).then(([edge, laaazypad]) => setPaths({ edge, laaazypad }))
    lazy.drm.status().then(setDrm)
    lazy.catalog.status().then((s) => setTmdbOn(s.configured))
    lazy.covers.status().then((s) => setGridOn(s.configured))
    lazy.yt.status().then((s) => { setYtOn(s.configured); setYtLeft(s.left) })
    lazy.ai.status().then((s) => { setAiOn(s.configured); setAiLeft(s.left); setAiModel(s.model) })
    lazy.power.openAtLogin().then(setAtLogin)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const choose = async (key: 'edge' | 'laaazypad', label: string) => {
    const p = await lazy?.exe.choose(key)
    if (p) { setPaths((cur) => ({ ...cur, [key]: p })); setMsg(`Pasta do ${label} salva.`) }
  }
  const saveModel = async () => {
    const ok = await lazy?.settings.set('geminiModel', aiModel.trim())
    setMsg(ok ? `Modelo do Gemini: ${aiModel.trim()}.` : 'Nome de modelo inválido. Use o nome da API, por exemplo gemini-3.8-flash.')
  }
  // Aceleração de vídeo no Edge por serviço (desligada = Edge sem GPU, para tela preta)
  const toggleGpu = (label: string) => {
    const off = noGpu.includes(label)
    const next = off ? noGpu.filter((x) => x !== label) : [...noGpu, label]
    setNoGpu(next)
    lazy?.settings.set('edgeNoGpu', next)
    setMsg(off ? `${label}: aceleração de vídeo ligada no Edge.` : `${label}: aceleração desligada no Edge (para tela preta). Feche o Edge e abra de novo; entre na conta uma vez nesse modo.`)
  }
  const [theme, setTheme] = useState(DEFAULT_THEME)
  const cycleTheme = () => {
    const next = nextTheme(theme)
    setTheme(next)
    applyTheme(next) // muda na hora
    lazy?.settings.set('theme', next)
    setMsg(`Cor do Laaazy: ${themeLabel(next)}.`)
  }
  const toggleLock = () => {
    const v = !lockOn
    setLockOn(v)
    lazy?.settings.set('lockCursor', v)
    setMsg(v ? 'O cursor do mouse fica preso na tela do Laaazy.' : 'O cursor do mouse pode sair da tela do Laaazy.')
  }
  const toggleTrailer = () => {
    const v = !trailerOn
    setTrailerOn(v)
    lazy?.settings.set('trailerPreview', v)
    setMsg(v ? 'Prévia do trailer ligada no Início.' : 'Prévia do trailer desligada.')
  }
  const togglePs = () => {
    const v = !psCloses
    setPsCloses(v)
    lazy?.settings.set('psClosesApp', v)
    setMsg(v ? 'O PS fecha o jogo (ou o que estiver na frente) e volta ao Início.' : 'O PS só volta ao Início; o jogo continua aberto.')
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
      <ProfileSettings sounds={sounds} onMsg={setMsg} />
      <button className="ds4-row" onClick={tap(() => choose('edge', 'Edge'))} onMouseEnter={sounds.hover}><span>Pasta do Edge</span><b>{paths.edge || 'não encontrado, toque para escolher'}</b></button>
      <button className="ds4-row" onClick={tap(() => choose('laaazypad', 'Laaazy-pad'))} onMouseEnter={sounds.hover}><span>Pasta do Laaazy-pad (perfis do controle)</span><b>{paths.laaazypad || 'não encontrado, toque para escolher'}</b></button>
      <button className="ds4-row" onClick={tap(cycleTheme)} onMouseEnter={sounds.hover}><span>Cor do Laaazy</span><b>{themeLabel(theme)}</b></button>
      <button className="ds4-row" onClick={tap(() => window.dispatchEvent(new Event('lz:welcome')))} onMouseEnter={sounds.hover}><span>Ver as boas-vindas de novo</span><b>▶</b></button>
      <button className="ds4-row" onClick={tap(toggleLock)} onMouseEnter={sounds.hover}><span>Prender o mouse na tela do Laaazy</span><b>{lockOn ? 'Sim' : 'Não'}</b></button>
      <button className="ds4-row" onClick={tap(toggleTrailer)} onMouseEnter={sounds.hover}><span>Prévia do trailer no Início</span><b>{trailerOn ? 'Ligada' : 'Desligada'}</b></button>
      <button className="ds4-row" onClick={tap(togglePs)} onMouseEnter={sounds.hover}><span>Botão PS fecha o jogo</span><b>{psCloses ? 'Sim (fecha à força)' : 'Não (como console)'}</b></button>
      <button className="ds4-row" onClick={tap(cycleSaver)} onMouseEnter={sounds.hover}><span>Proteção de tela</span><b>{saverMin ? `${saverMin} min` : 'Desligada'}</b></button>
      <button className="ds4-row" onClick={tap(toggleLogin)} onMouseEnter={sounds.hover}><span>Abrir junto com o Windows</span><b>{atLogin ? 'Sim' : 'Não'}</b></button>
      <ApiKeySection
        title="Filmes e séries (TMDB)" configured={tmdbOn} sounds={sounds}
        help='Para o Início mostrar filmes e séries. Crie uma chave grátis em themoviedb.org → Configurações → API e cole a "Chave da API" ou o "Token de Leitura da API" (X no campo abre o teclado).'
        note="Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB."
        onSave={(k) => lazy!.catalog.setKey(k)} onClear={() => lazy!.catalog.clearKey()}
        onResult={(m, on) => { setMsg(m); setTmdbOn(on) }}
      />
      <ApiKeySection
        title="Parecido com este (Gemini)" configured={aiOn} sounds={sounds}
        help={`Com △ num título do Início, a IA diz o clima dele e sugere outros com o mesmo clima. Chave grátis em aistudio.google.com → Get API key. ${aiOn ? `Restam ${aiLeft} de 50 pedidos hoje.` : ''}`}
        note="A IA só sugere nomes; cada título é conferido no TMDB."
        onSave={(k) => lazy!.ai.setKey(k)} onClear={() => lazy!.ai.clearKey()}
        onResult={(m, on) => { setMsg(m); setAiOn(on) }}
      />
      <label className="ds4-row" style={{ cursor: 'text' }}>
        <span>Modelo do Gemini</span>
        <input value={aiModel} onChange={(e) => setAiModel(e.target.value)} spellCheck={false} aria-label="Modelo do Gemini"
          style={{ flex: 1, marginLeft: 24, background: 'transparent', border: 0, color: 'inherit', font: 'inherit', textAlign: 'right' }} />
      </label>
      <button className="ds4-row" onClick={tap(saveModel)} onMouseEnter={sounds.hover}><span>Salvar modelo</span><b>▶</b></button>
      <ApiKeySection
        title="Trailers dublados e legendados (YouTube)" configured={ytOn} sounds={sounds}
        help={`Para o Início achar o trailer dublado ou legendado. No console.cloud.google.com (pode ser o mesmo projeto do Gemini): Biblioteca → "YouTube Data API v3" → Ativar; depois Credenciais → Criar chave de API. Se a chave do Gemini estiver no mesmo projeto e sem restrição, ela também serve. ${ytOn ? `Restam ${ytLeft} de 90 buscas hoje.` : ''}`}
        note="Cada título é buscado uma vez e fica guardado por 30 dias."
        onSave={(k) => lazy!.yt.setKey(k)} onClear={() => lazy!.yt.clearKey()}
        onResult={(m, on) => { setMsg(m); setYtOn(on) }}
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
      <h2 className="ds4-help">Aceleração de vídeo no Edge</h2>
      <p className="ds4-help">Se um serviço abrir com tela preta no Edge, desligue a aceleração dele. Ele passa a abrir num perfil separado do Edge (entre na conta uma vez).</p>
      {streaming.map((s) => (
        <button key={`gpu-${s.label}`} className="ds4-row" onClick={tap(() => toggleGpu(s.label))} onMouseEnter={sounds.hover}>
          <span>{s.label}</span><b>{noGpu.includes(s.label) ? 'Desligada' : 'Ligada'}</b>
        </button>
      ))}
    </section>
  )
}
