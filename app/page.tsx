'use client'

import { useEffect, useRef, useState } from 'react'
import { BRAND } from '@/lib/brand-icons'
import PS4Background from './components/PS4Background'
import { BookOpen, Gamepad2, Headphones, Mail, MonitorPlay, Music2, Power, Settings, Smile, Trophy, UserRound, Video } from 'lucide-react'

const items: { label: string; url?: string; app?: string; brand?: string; bg?: string; fg?: string; wordmark?: string; icon: any; kind: string }[] = [
  { label: 'Loja Hydra', app: 'hydra', icon: 'hydra', kind: 'utility' },
  { label: 'Biblioteca', icon: BookOpen, kind: 'games' },
  { label: 'Crunchyroll', brand: 'crunchyroll', bg: '#F47521', url: 'https://www.crunchyroll.com', icon: Video, kind: 'utility' },
  { label: 'HBO Max', brand: 'hbomax', bg: '#4B1FA8', url: 'https://www.hbomax.com', icon: MonitorPlay, kind: 'utility' },
  { label: 'Prime Video', bg: '#00A8E1', url: 'https://www.primevideo.com', icon: Video, kind: 'utility' },
  { label: 'Netflix', brand: 'netflix', bg: '#141414', fg: '#E50914', url: 'https://www.netflix.com', icon: MonitorPlay, kind: 'utility' },
  { label: 'YouTube', brand: 'youtube', bg: '#FF0000', url: 'https://www.youtube.com/tv', icon: Video, kind: 'utility' },
  { label: 'Spotify', brand: 'spotify', bg: '#1ED760', fg: '#000', url: 'https://open.spotify.com', icon: Music2, kind: 'utility' },
  { label: 'Google Chrome', app: 'chrome', brand: 'chrome', bg: '#1A73E8', icon: MonitorPlay, kind: 'utility' },
  { label: 'Firefox', app: 'firefox', brand: 'firefox', bg: '#E66000', icon: MonitorPlay, kind: 'utility' },
  { label: 'DS4Windows', app: 'ds4windows', icon: Gamepad2, kind: 'utility' },
]

type Game = { id: string; name: string; platform: string; cover?: string }

// Move o foco entre botões da Biblioteca pelo D-pad/analógico
function focusMove(dx: number, dy: number) {
  const els = Array.from(document.querySelectorAll<HTMLElement>('.library-view button, .library-view input, .ds4-view button')).filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 })
  const cur = document.activeElement as HTMLElement | null
  if (!cur || !els.includes(cur)) { els[0]?.focus(); return }
  const a = cur.getBoundingClientRect()
  const ax = a.left + a.width / 2, ay = a.top + a.height / 2
  let best: HTMLElement | null = null, bestD = Infinity
  for (const el of els) {
    if (el === cur) continue
    const b = el.getBoundingClientRect()
    const ox = b.left + b.width / 2 - ax, oy = b.top + b.height / 2 - ay
    const along = dx ? ox * dx : oy * dy
    if (along <= 4) continue
    const d = along + (dx ? Math.abs(oy) : Math.abs(ox)) * 2.5
    if (d < bestD) { bestD = d; best = el }
  }
  if (best) { best.focus(); best.scrollIntoView({ block: 'nearest' }) }
}

function LibraryView({ onBack, playHoverSound, playClickSound }: { onBack: () => void; playHoverSound: () => void; playClickSound: () => void }) {
  const [platform, setPlatform] = useState('Todos')
  const [query, setQuery] = useState('')
  const [games, setGames] = useState<Game[]>([])
  const [busy, setBusy] = useState('')
  const [msg, setMsg] = useState('')
  const lazy = typeof window !== 'undefined' ? (window as any).lazy : undefined
  const refresh = async (fresh = false) => { if (lazy?.games) setGames(await lazy.games.list(fresh ? { fresh: true } : undefined)) }
  // Varrer uma pasta grande demora. Antes a tela ficava parada, sem dizer nada,
  // e o retorno (quantos jogos entraram) era jogado fora.
  const add = async (kind: 'addExe' | 'addFolder') => {
    if (!lazy?.games) return
    setMsg('')
    setBusy(kind === 'addFolder' ? 'Procurando jogos na pasta...' : 'Adicionando...')
    try {
      const r = await lazy.games[kind]()
      setMsg(r?.msg ?? '')
      await refresh(true)
    } finally { setBusy('') }
  }
  const launch = async (g: Game) => {
    if (!lazy?.games) return
    const r = await lazy.games.launch(g.id)
    if (r && r.ok === false) { setMsg(r.msg); refresh(true) }
  }
  useEffect(() => { refresh() }, [])
  useEffect(() => {
    if (document.querySelector('.library-view :focus')) return
    const first = document.querySelector<HTMLElement>('.library-card') ?? document.querySelector<HTMLElement>('.find-games-button')
    first?.focus()
  }, [games.length])
  const platforms = ['Todos', 'Steam', 'Epic Games', 'Meu PC']
  const filteredGames = games.filter((g) => (platform === 'Todos' || g.platform === platform) && g.name.toLowerCase().includes(query.toLowerCase()))

  return <section className="library-view" aria-label="Biblioteca de jogos">
    <aside className="library-sidebar">
      <button className="library-back" onClick={() => { playClickSound(); onBack() }} onMouseEnter={playHoverSound}>‹ Biblioteca</button>
      <div className="library-search-box"><button type="button" className="find-games-button" onClick={() => { playClickSound(); add('addExe') }} onMouseEnter={playHoverSound}><span className="search-button-icon" aria-hidden="true">＋</span><span><strong>Adicionar jogo</strong><small>Escolher o .exe do jogo</small></span></button><button type="button" className="find-games-button" onClick={() => { playClickSound(); add('addFolder') }} onMouseEnter={playHoverSound}><span className="search-button-icon" aria-hidden="true">▤</span><span><strong>Adicionar pasta</strong><small>Achar jogos dentro de uma pasta</small></span></button><label className="library-search"><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filtrar biblioteca" aria-label="Filtrar biblioteca" /></label></div>
      <h3>Esse PC</h3>
      <button className={`library-filter ${platform === 'Todos' ? 'active' : ''}`} onClick={() => { playClickSound(); setPlatform('Todos') }} onMouseEnter={playHoverSound}>▦ <span>Todos</span><b>{games.length}</b></button>
      <div className="pc-platforms" aria-label="Bibliotecas de plataformas">
        {platforms.slice(1).map((name) => <button key={name} className={`pc-platform ${platform === name ? 'active' : ''}`} onClick={() => { playClickSound(); setPlatform(name) }} onMouseEnter={playHoverSound}><span className="platform-mark">{name === 'Steam' ? 'S' : name === 'Epic Games' ? 'E' : name === 'Ubisoft Connect' ? 'U' : name === 'Xbox' ? 'X' : 'P'}</span><span>{name}</span></button>)}
      </div>
    </aside>
    <div className="library-main">
      <div className="library-top"><h1>Biblioteca</h1><button className="sort-button">Nome: A a Z　⌄</button></div>
      <div className="library-status">{platform === 'Todos' ? 'Jogos encontrados neste computador' : `Jogos da ${platform}`} <span>{filteredGames.length}</span></div>
      {busy && <p className="library-msg" role="status">{busy}</p>}
      {msg && !busy && <p className="library-msg" role="status">{msg}</p>}
      <div className="library-grid">{filteredGames.length === 0 && <p style={{ gridColumn: '1 / -1', opacity: .75, fontSize: 18 }}>Nenhum jogo encontrado. Use &quot;Adicionar jogo&quot; ou &quot;Adicionar pasta&quot;.</p>}{filteredGames.map((g) => <button key={g.id} className="library-card" onClick={() => { playClickSound(); launch(g) }} onContextMenu={(e) => { e.preventDefault(); if (g.platform === 'Meu PC' && window.confirm(`Remover "${g.name}" da lista?`)) { lazy?.games?.remove(g.id).then(() => refresh(true)) } }} onMouseEnter={playHoverSound}><div className={`library-cover ${g.cover ? 'has-cover' : ''}`}><span>{g.name}</span>{g.cover && <img src={g.cover} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement?.classList.remove('has-cover') }} />}<small>▶</small></div><strong>{g.name}</strong></button>)}</div>
    </div>
  </section>
}

const DS4_KEYS = ['menu', 'Crunchyroll', 'HBO Max', 'Prime Video', 'Netflix', 'YouTube', 'Spotify', 'Google Chrome', 'Firefox']

function Ds4View({ onBack, playHoverSound, playClickSound }: { onBack: () => void; playHoverSound: () => void; playClickSound: () => void }) {
  const lazy = typeof window !== 'undefined' ? (window as any).lazy : undefined
  const [data, setData] = useState<{ profiles: string[]; config: Record<string, string>; dir: string | null; cmd: string } | null>(null)
  useEffect(() => { lazy?.ds4?.get().then(setData) }, [])
  const [msg, setMsg] = useState('')
  const [edge, setEdge] = useState('')
  const [closeDs4, setCloseDs4] = useState(true)
  useEffect(() => { lazy?.settings?.get().then((s: any) => setCloseDs4(s.closeDs4OnMenu)) }, [])
  useEffect(() => { lazy?.edge?.get().then(setEdge) }, [])
  const options = ['', ...(data?.profiles ?? [])]
  const cycle = async (key: string) => {
    if (!data) return
    const cur = data.config[key] ?? ''
    const next = options[(options.indexOf(cur) + 1) % options.length]
    setData({ ...data, config: { ...data.config, [key]: next } })
    const r = await lazy.ds4.set(key, next)
    setMsg(r?.msg ?? '')
  }
  return <section className="ds4-view" aria-label="Perfis do DS4Windows">
    <button className="library-back" onClick={() => { playClickSound(); onBack() }} onMouseEnter={playHoverSound}>‹ DS4Windows</button>
    <h1>Perfil do controle em cada app</h1>
    <p className="ds4-help">Aperte X numa linha para trocar o perfil. Ele já é aplicado na hora, para você testar, e também ao abrir o card. Ao sair, volta o perfil do Menu. Atalhos no teclado: Ctrl+Alt+Home volta ao menu; Ctrl+Alt+End fecha o que está na frente e volta.</p>
    <button className="ds4-row" onClick={() => { playClickSound(); setMsg('Abrindo...'); lazy?.launch('ds4windows').then((r: string) => setMsg(r || 'DS4Windows aberto.')) }} onMouseEnter={playHoverSound}><span>Abrir o DS4Windows</span><b>▶</b></button>
    {msg && <p className="ds4-help" style={{ color: '#ffd23f' }}>{msg}</p>}
    {data && data.profiles.length === 0 && <p className="ds4-help">Não achei perfis. Abra o DS4Windows, salve pelo menos um perfil e volte aqui.</p>}
    <button className="ds4-row" onClick={() => { playClickSound(); const v = !closeDs4; setCloseDs4(v); lazy?.settings?.set('closeDs4OnMenu', v); setMsg(v ? 'Ao apertar PS, o DS4Windows será fechado.' : 'O DS4Windows continuará aberto ao apertar PS.') }} onMouseEnter={playHoverSound}><span>Fechar o DS4Windows ao apertar PS</span><b>{closeDs4 ? 'Sim' : 'Não'}</b></button>
    <button className="ds4-row" onClick={async () => { playClickSound(); const p = await lazy?.edge?.choose(); if (p) { setEdge(p); setMsg('Pasta do Edge salva.') } }} onMouseEnter={playHoverSound}><span>Pasta do Edge (Crunchyroll)</span><b>{edge || 'não encontrado, toque para escolher'}</b></button>
    {DS4_KEYS.map((k) => <button key={k} className="ds4-row" onClick={() => { playClickSound(); cycle(k) }} onMouseEnter={playHoverSound}><span>{k === 'menu' ? 'Menu (ao abrir o app e ao voltar)' : k}</span><b>{data?.config[k] || 'não mudar'}</b></button>)}
  </section>
}

export default function Page() {
  const [selected, setSelected] = useState(0)
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [ds4Open, setDs4Open] = useState(false)
  const [padOn, setPadOn] = useState(false)
  const [libraryTransition, setLibraryTransition] = useState(false)
  const [libraryEntering, setLibraryEntering] = useState(false)
  const [libraryLeaving, setLibraryLeaving] = useState(false)
  const hoverAudioRef = useRef<HTMLAudioElement | null>(null)
  const clickAudioRef = useRef<HTMLAudioElement | null>(null)
  const tileRefs = useRef<(HTMLButtonElement | null)[]>([])
  const libraryOpenRef = useRef(false)
  libraryOpenRef.current = libraryOpen || ds4Open

  const playHoverSound = () => {
    const audio = hoverAudioRef.current
    if (!audio) return
    audio.currentTime = 0
    void audio.play().catch(() => undefined)
  }

  const playClickSound = () => {
    const audio = clickAudioRef.current
    if (!audio) return
    audio.currentTime = 0
    void audio.play().catch(() => undefined)
  }

  useEffect(() => {
    const handleNavigation = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') setSelected((current) => Math.max(0, current - 1))
      if (event.key === 'ArrowRight') setSelected((current) => Math.min(items.length - 1, current + 1))
    }
    window.addEventListener('keydown', handleNavigation)
    return () => window.removeEventListener('keydown', handleNavigation)
  }, [])

  useEffect(() => {
    ;(window as any).lazy?.onHome?.(() => { setLibraryOpen(false); setLibraryLeaving(false); setLibraryEntering(false); setDs4Open(false) })
  }, [])

  useEffect(() => {
    const el = document.querySelector<HTMLElement>('.ps4-screen')
    if (!el) return
    const fix = () => { if (el.scrollLeft !== 0) el.scrollLeft = 0 }
    el.addEventListener('scroll', fix)
    return () => el.removeEventListener('scroll', fix)
  }, [])

  useEffect(() => {
    if (!libraryOpen && !ds4Open) tileRefs.current[selected]?.focus()
  }, [selected, libraryOpen, ds4Open])

  useEffect(() => {
    let raf = 0
    let last = 0
    let padSeen = false
    const held: Record<number, boolean> = {}
    const tick = () => {
      const pad = Array.from(navigator.getGamepads?.() ?? []).find(Boolean)
      if (padSeen !== !!pad) { padSeen = !!pad; setPadOn(!!pad) }
      if (pad) {
        const now = performance.now()
        const x = pad.axes[0] ?? 0
        const dir = pad.buttons[15]?.pressed || x > 0.6 ? 1 : pad.buttons[14]?.pressed || x < -0.6 ? -1 : 0
        const y = pad.axes[1] ?? 0
        const dyv = pad.buttons[13]?.pressed || y > 0.6 ? 1 : pad.buttons[12]?.pressed || y < -0.6 ? -1 : 0
        if ((dir || dyv) && now - last > 220) {
          if (libraryOpenRef.current) focusMove(dir, dir ? 0 : dyv)
          else if (dir) setSelected((c) => Math.min(items.length - 1, Math.max(0, c + dir)))
          last = now
        }
        if (!dir && !dyv) last = 0
        const edge = (i: number) => {
          const p = !!pad.buttons[i]?.pressed
          const fire = p && !held[i]
          held[i] = p
          return fire
        }
        if (edge(0)) (document.activeElement as HTMLElement | null)?.click() // X
        if (edge(1) && libraryOpenRef.current) document.querySelector<HTMLElement>('.library-back')?.click() // O
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <main className={`ps4-screen ${libraryEntering ? 'library-entering' : ''} ${libraryLeaving ? 'library-leaving' : ''}`}>
      <PS4Background />
      <audio ref={hoverAudioRef} preload="auto" src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/audio-Hi1CYeB1VQNnJ1e9iUR7e4UO9aoyYv.mp3" aria-hidden="true" />
      <audio ref={clickAudioRef} preload="auto" src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Dlg%20Yes-fwFGNctIK5xxRioIbyEgUO2NuFOPf7.mp3" aria-hidden="true" />
      <div className="pad-badge">{padOn ? 'Controle conectado' : 'Controle não detectado. Aperte um botão.'}</div>
      <header className="ps4-header">
        <div className="ps4-user"><div className="crash-avatar">B</div><strong>Bruno</strong></div>
        <nav className="ps4-icons" aria-label="Ações do sistema">
          <button type="button" aria-label="Controle" onClick={playClickSound} onMouseEnter={playHoverSound}><Gamepad2 /></button>
          <button type="button" className="icon-with-badge" aria-label="Mensagens" onClick={playClickSound} onMouseEnter={playHoverSound}><Mail /><b>2</b></button>
          <button type="button" aria-label="Perfil" onClick={playClickSound} onMouseEnter={playHoverSound}><Smile /></button>
          <button type="button" aria-label="Headset" onClick={playClickSound} onMouseEnter={playHoverSound}><Headphones /></button>
          <button type="button" aria-label="Trofeus" onClick={playClickSound} onMouseEnter={playHoverSound}><Trophy /></button>
          <button type="button" aria-label="Configuracoes" onClick={playClickSound} onMouseEnter={playHoverSound}><Settings /></button>
          <button type="button" aria-label="Energia" onClick={playClickSound} onMouseEnter={playHoverSound}><Power /></button>
        </nav>
        <time>14:38</time>
      </header>


      {libraryOpen ? <LibraryView onBack={() => { playClickSound(); setLibraryLeaving(true); setLibraryTransition(true); window.setTimeout(() => { setLibraryOpen(false); setLibraryLeaving(false); setLibraryTransition(false) }, 620) }} playHoverSound={playHoverSound} playClickSound={playClickSound} /> : ds4Open ? <Ds4View onBack={() => setDs4Open(false)} playHoverSound={playHoverSound} playClickSound={playClickSound} /> : <section className="ps4-content" aria-label="Aplicativos e jogos">
        <div className="cards-scroll w-full overflow-visible px-8 py-12 scrollbar-none" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <div className="ps4-tiles flex flex-row gap-[100px] overflow-x-auto pb-8 scrollbar-none" role="list" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {items.map((item, index) => {
            const Icon = item.icon === 'hydra' ? null : item.icon
            const isSelected = index === selected
            return (
              <div key={item.label} className="ps4-tile-group group flex w-[150px] shrink-0 flex-col items-start focus-within:z-10 hover:z-10">
                <button ref={(el) => { tileRefs.current[index] = el }} type="button" role="listitem" className={`ps4-tile shrink-0 ${item.kind} ${isSelected ? 'is-selected' : ''}`} onClick={() => { playClickSound(); setSelected(index); const lazy = (window as any).lazy; if (item.app === 'ds4windows') { setDs4Open(true); return } if (item.app) { lazy?.launch(item.app).then((r: string) => { if (r) window.alert(r) }); return } if (item.url) { if (lazy) lazy.open(item.url, item.label).then((r: string) => { if (r) window.alert(r) }); else window.location.href = item.url; return } if (item.label === 'Biblioteca') { setLibraryOpen(true); setLibraryEntering(true); window.setTimeout(() => setLibraryEntering(false), 420) } }} onMouseEnter={() => setSelected(index)} onFocus={playHoverSound} aria-label={item.label}>
                  <div className="tile-image" style={item.bg ? { background: item.bg } : undefined}>
                    {item.brand && BRAND[item.brand] ? <svg viewBox="0 0 24 24" className="tile-icon" fill={item.fg || '#fff'} aria-hidden="true"><path d={BRAND[item.brand]} /></svg> : item.wordmark ? <span className="tile-wordmark">{item.wordmark}</span> : item.icon === 'hydra' ? <img className="hydra-icon" src="/hydra-icon.png" alt="" /> : Icon && <Icon className="tile-icon" strokeWidth={1.35} />}
                    <span className="tile-label" style={item.fg === '#000' ? { color: '#000' } : undefined}>{item.label}</span>
                  </div>
                </button>
                <div className={`start-panel transition-opacity duration-200 ${isSelected ? 'opacity-100' : 'opacity-0'}`} aria-hidden="true">
                  <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-cPxESVJHgzFRcqFKZmiuX06C9PDPjS.png" alt="" /><span className="start-name">{item.label}</span>
                </div>
              </div>
            )
          })}
        </div>
          </div>
      </section>}

      <footer className="ps4-footer">
        <div className="ps4-hints" aria-label={libraryOpen ? 'Comandos da Biblioteca' : 'Comandos do menu'}>{libraryOpen ? <><span><img className="confirm-command-icon" src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-RmsaVZFRGft3ZQ23np6JD9Ct1RZztJ.png" alt="" /><strong>Confirmar</strong></span><span><img className="back-command-icon" src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-efPFMsWuBwJacjHRT3XAlB7m1bJ8gX.png" alt="" /><strong>Voltar</strong></span><span><img className="details-command-icon" src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-fbLU9pFFvFFk5kDdTWVlmaNWxKsSDw.png" alt="" /><strong>Detalhes</strong></span><span><img className="search-command-icon" src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-GXcI3yAQ20XUtdiI4nztFeFYyfwOai.png" alt="" /><strong>Buscar</strong></span></> : <><span><img className="confirm-command-icon" src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-RmsaVZFRGft3ZQ23np6JD9Ct1RZztJ.png" alt="" /><strong>Confirmar</strong></span><span><img className="back-command-icon" src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-efPFMsWuBwJacjHRT3XAlB7m1bJ8gX.png" alt="" /><strong>Voltar</strong></span><span><img className="details-command-icon" src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-fbLU9pFFvFFk5kDdTWVlmaNWxKsSDw.png" alt="" /><strong>Detalhes</strong></span><span><img className="search-command-icon" src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-GXcI3yAQ20XUtdiI4nztFeFYyfwOai.png" alt="" /><strong>Buscar</strong></span></>}</div>
        <div className="ps4-live"><UserRound size={22} /><div><strong>Bruno está online</strong><small>Biblioteca pronta para jogar</small></div></div>
      </footer>
    </main>
  )
}

