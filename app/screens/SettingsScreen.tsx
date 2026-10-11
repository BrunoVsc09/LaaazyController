'use client'

import { useEffect, useState, type ReactNode } from 'react'
import gamepad from '../../shared/gamepad'
import streaming from '../../shared/streaming'
import ApiKeySection from '../components/ApiKeySection'
import ProfileSettings from '../components/ProfileSettings'
import { nextMinutes } from '../lib/screensaver'
import { SETTINGS_SECTIONS, nextSection, pathStatus, type SectionId } from '../lib/settings-menu'
import { useGamepad } from '../hooks/useGamepad'
import { getLazy, type DrmStatus, type StreamMode } from '../lib/lazy-api'
import { DEFAULT_THEME, applyTheme, nextTheme, themeLabel, themeOf } from '../lib/theme'
import type { Sounds } from '../hooks/useSounds'

type Props = { onBack: () => void; onController: () => void; sounds: Sounds }
const MODE_LABEL: Record<StreamMode, string> = { app: 'No app', edge: 'No Edge (tela cheia)' }

export default function SettingsScreen({ onBack, onController, sounds }: Props) {
  const lazy = getLazy()
  // Uma categoria por vez (menu à esquerda); L1/R1 trocam, menos com o teclado na tela ou uma janelinha aberta
  const [section, setSection] = useState<SectionId>('perfil')
  const goSection = (id: SectionId) => { setSection(id); setMsg('') }
  useGamepad(({ fired }) => {
    if (document.querySelector('.osk, [data-modal], [data-pad-capture]')) return
    const step = fired(gamepad.BTN.R1) ? 1 : fired(gamepad.BTN.L1) ? -1 : 0
    if (step) { sounds.click(); goSection(nextSection(section, step)) }
  })
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

  const row = (label: string, value: ReactNode, onClick: () => void) => (
    <button className="ds4-row" onClick={tap(onClick)} onMouseEnter={sounds.hover}><span>{label}</span><b>{value}</b></button>
  )
  const keys = (
    <>
      <ApiKeySection
        title="Filmes e séries (TMDB)" configured={tmdbOn} sounds={sounds}
        help='Para o Início mostrar filmes e séries. Crie uma chave grátis em themoviedb.org → Configurações → API e cole a "Chave da API" ou o "Token de Leitura da API" (X no campo abre o teclado).'
        note="Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB."
        onSave={(k) => lazy!.catalog.setKey(k)} onClear={() => lazy!.catalog.clearKey()}
        onResult={(m, on) => { setMsg(m); setTmdbOn(on) }}
      />
      <ApiKeySection
        title="Trailers dublados e legendados (YouTube)" configured={ytOn} sounds={sounds}
        help={`Para o Início achar o trailer dublado ou legendado. No console.cloud.google.com (pode ser o mesmo projeto do Gemini): Biblioteca → "YouTube Data API v3" → Ativar; depois Credenciais → Criar chave de API. ${ytOn ? `Restam ${ytLeft} de 90 buscas hoje.` : ''}`}
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
      <ApiKeySection
        title="Parecido com este (Gemini)" configured={aiOn} sounds={sounds}
        help={`Com △ num título do Início, a IA diz o clima dele e sugere outros com o mesmo clima. Chave grátis em aistudio.google.com → Get API key. ${aiOn ? `Restam ${aiLeft} de 50 pedidos hoje.` : ''}`}
        note="A IA só sugere nomes; cada título é conferido no TMDB."
        onSave={(k) => lazy!.ai.setKey(k)} onClear={() => lazy!.ai.clearKey()}
        onResult={(m, on) => { setMsg(m); setAiOn(on) }}
      />
    </>
  )
  const content: Record<SectionId, ReactNode> = {
    perfil: <ProfileSettings sounds={sounds} onMsg={setMsg} />,
    aparencia: <>
      {row('Cor do Laaazy', themeLabel(theme), cycleTheme)}
      {row('Prévia do trailer no Início', trailerOn ? 'Ligada' : 'Desligada', toggleTrailer)}
      {row('Proteção de tela', saverMin ? `${saverMin} min` : 'Desligada', cycleSaver)}
    </>,
    controle: <>
      {row('Botão PS fecha o jogo', psCloses ? 'Sim (fecha à força)' : 'Não (como console)', togglePs)}
      {row('Prender o mouse na tela do Laaazy', lockOn ? 'Sim' : 'Não', toggleLock)}
      {row('Perfis do controle (botões, botão de voltar)', '▶', onController)}
    </>,
    streaming: <>
      <p className="ds4-help">{drm ? drm.msg : 'Verificando o Widevine (DRM)...'} Se um vídeo não tocar dentro do app, troque o serviço para o Edge.</p>
      {streaming.map((s) => {
        const mode = modes[s.label] ?? (s.mode as StreamMode)
        return <span key={s.label} style={{ display: 'contents' }}>{row(s.label, MODE_LABEL[mode], () => toggleMode(s.label, mode))}</span>
      })}
    </>,
    chaves: keys,
    sistema: <>
      {row('Abrir junto com o Windows', atLogin ? 'Sim' : 'Não', toggleLogin)}
      {row('Ver as boas-vindas de novo', '▶', () => window.dispatchEvent(new Event('lz:welcome')))}
    </>,
    avancado: <>
      {row('Pasta do Edge', pathStatus(paths.edge), () => choose('edge', 'Edge'))}
      {paths.edge && <p className="settings-path">{paths.edge}</p>}
      {row('Pasta do Laaazy-pad', pathStatus(paths.laaazypad), () => choose('laaazypad', 'Laaazy-pad'))}
      {paths.laaazypad && <p className="settings-path">{paths.laaazypad}</p>}
      <label className="ds4-row" style={{ cursor: 'text' }}>
        <span>Modelo do Gemini</span>
        <input value={aiModel} onChange={(e) => setAiModel(e.target.value)} spellCheck={false} aria-label="Modelo do Gemini"
          style={{ flex: 1, marginLeft: 24, background: 'transparent', border: 0, color: 'inherit', font: 'inherit', textAlign: 'right' }} />
      </label>
      {row('Salvar modelo', '▶', saveModel)}
      <h3 className="settings-sub">Aceleração de vídeo no Edge</h3>
      <p className="ds4-help">Se um serviço abrir com tela preta no Edge, desligue a aceleração dele. Ele passa a abrir num perfil separado do Edge (entre na conta uma vez).</p>
      {streaming.map((s) => <span key={`gpu-${s.label}`} style={{ display: 'contents' }}>{row(s.label, noGpu.includes(s.label) ? 'Desligada' : 'Ligada', () => toggleGpu(s.label))}</span>)}
    </>,
  }
  const current = SETTINGS_SECTIONS.find((s) => s.id === section)!

  return (
    <section className="ds4-view settings-view" aria-label="Configurações">
      <button className="library-back" onClick={onBack} onMouseEnter={sounds.hover}>‹ Configurações</button>
      <h1>Configurações</h1>
      <div className="settings-layout">
        <nav className="settings-nav" aria-label="Categorias" data-focus-group>
          {SETTINGS_SECTIONS.map((s) => (
            <button key={s.id} type="button" className={`settings-cat ${section === s.id ? 'on' : ''}`} aria-current={section === s.id ? 'page' : undefined} data-entry={section === s.id || undefined}
              onClick={tap(() => goSection(s.id))} onMouseEnter={sounds.hover}>{s.label}</button>
          ))}
          <p className="settings-l1r1">L1/R1 trocam a categoria</p>
        </nav>
        <div className="settings-panel">
          <h2>{current.label}</h2>
          <p className="settings-hint">{current.hint}</p>
          {msg && <p className="ds4-help settings-msg" role="status">{msg}</p>}
          {content[section]}
        </div>
      </div>
    </section>
  )
}
