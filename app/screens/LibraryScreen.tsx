'use client'

import { useEffect, useRef, useState } from 'react'
import FileBrowser from '../components/FileBrowser'
import GameMenu from '../components/GameMenu'
import { getLazy, type Ds4Data, type Game } from '../lib/lazy-api'
import { nextSort, visibleGames, type Sort } from '../lib/library-filter'
import type { Sounds } from '../hooks/useSounds'

const PLATFORMS = ['Todos', 'Steam', 'Epic Games', 'Meu PC']
const MARK: Record<string, string> = { Steam: 'S', 'Epic Games': 'E', 'Meu PC': 'P' }

type Props = { onBack: () => void; sounds: Sounds }

export default function LibraryScreen({ onBack, sounds }: Props) {
  const lazy = getLazy()
  const [platform, setPlatform] = useState('Todos')
  const [query, setQuery] = useState('')
  const [games, setGames] = useState<Game[]>([])
  const gamesRef = useRef<Game[]>([])
  gamesRef.current = games
  const [busy, setBusy] = useState('')
  const [msg, setMsg] = useState('')
  const [sort, setSort] = useState<Sort>('asc')
  // Menu do jogo (△ ou botão direito): perfil do controle do jogo ou remover da Biblioteca
  const [ds4, setDs4] = useState<Ds4Data | null>(null)
  const [picker, setPicker] = useState<Game | null>(null)
  // O ○ (lz:close-modal) é ouvido uma vez só: lê o jogo do menu aberto por aqui, não do primeiro render
  const pickerRef = useRef<Game | null>(null)
  pickerRef.current = picker
  const loadDs4 = () => lazy?.ds4.get().then(setDs4)
  const profileOf = (g: Game) => ds4?.config[`game:${g.id}`] || ''
  const closePicker = (g: Game | null = pickerRef.current) => {
    setPicker(null)
    if (g) window.setTimeout(() => document.querySelector<HTMLElement>(`.library-card[data-id="${CSS.escape(g.id)}"]`)?.focus(), 0)
  }
  // Remover: jogo do PC sai da lista; Steam/Epic ficam ocultos. A borda vai para o card vizinho
  const remove = async (g: Game) => {
    if (!lazy) return
    const cards = Array.from(document.querySelectorAll<HTMLElement>('.library-card'))
    const i = cards.findIndex((c) => c.dataset.id === g.id)
    const neighbor = (cards[i + 1] ?? cards[i - 1])?.dataset.id
    const r = await lazy.games.remove(g.id)
    setMsg(r.ok ? `"${g.name}" saiu da Biblioteca.` : r.msg)
    setPicker(null)
    await refresh(true)
    window.setTimeout(() => (document.querySelector<HTMLElement>(`.library-card[data-id="${CSS.escape(neighbor ?? '')}"]`) ?? document.querySelector<HTMLElement>('.find-games-button'))?.focus(), 0)
  }
  const choose = async (g: Game, profile: string) => {
    if (!lazy) return
    const r = await lazy.ds4.set(`game:${g.id}`, profile)
    setMsg(r.ok ? `${g.name}: ${profile ? `perfil "${profile}"` : 'usa o padrão dos jogos'}.` : r.msg)
    await loadDs4()
    closePicker(g)
  }
  useEffect(() => {
    loadDs4()
    const onTriangle = () => {
      const id = (document.activeElement as HTMLElement | null)?.closest<HTMLElement>('.library-card')?.dataset.id
      const g = id && gamesRef.current.find((x) => x.id === id)
      if (g) setPicker(g)
    }
    const onClose = () => { closePicker(); setBrowse(null) }
    window.addEventListener('lz:triangle', onTriangle)
    window.addEventListener('lz:close-modal', onClose)
    return () => { window.removeEventListener('lz:triangle', onTriangle); window.removeEventListener('lz:close-modal', onClose) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleSort = () => {
    const next = nextSort(sort)
    setSort(next)
    lazy?.settings.set('librarySort', next)
  }

  const refresh = async (fresh = false) => { if (lazy) setGames(await lazy.games.list(fresh ? { fresh: true } : undefined)) }

  // Varrer uma pasta grande demora: mostra que está trabalhando e quantos jogos entraram
  const add = async (kind: 'addExe' | 'addFolder' | 'addExePath' | 'addFolderPath', path?: string) => {
    if (!lazy) return
    setMsg('')
    setBusy(kind.startsWith('addFolder') ? 'Procurando jogos na pasta...' : 'Adicionando...')
    try {
      const r = kind === 'addExePath' || kind === 'addFolderPath' ? await lazy.games[kind](path ?? '') : await lazy.games[kind]()
      setMsg(r.msg)
      await refresh(true)
    } finally { setBusy('') }
  }
  // Navegador de pastas do Laaazy (controle); a janela do Windows fica como opção para mouse
  const [browse, setBrowse] = useState<'file' | 'dir' | null>(null)
  const pickPath = (path: string) => {
    const mode = browse
    setBrowse(null)
    void add(mode === 'dir' ? 'addFolderPath' : 'addExePath', path)
    window.setTimeout(() => document.querySelector<HTMLElement>('.find-games-button')?.focus(), 0)
  }
  const useWindows = () => {
    const mode = browse
    setBrowse(null)
    void add(mode === 'dir' ? 'addFolder' : 'addExe')
  }

  const launch = async (g: Game) => {
    if (!lazy) return
    const r = await lazy.games.launch(g.id)
    if (!r.ok) { setMsg(r.msg); refresh(true) }
  }

  useEffect(() => {
    refresh()
    lazy?.settings.get().then((s) => setSort(s.librarySort))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (document.querySelector('.library-view :focus')) return
    const first = document.querySelector<HTMLElement>('.library-card') ?? document.querySelector<HTMLElement>('.find-games-button')
    first?.focus()
  }, [games.length])

  const shown = visibleGames(games, { platform, query, sort })
  const tap = (fn: () => void) => () => { sounds.click(); fn() }

  return (
    <section className="library-view" aria-label="Biblioteca de jogos">
      <aside className="library-sidebar">
        <button className="library-back" onClick={onBack} onMouseEnter={sounds.hover}>‹ Biblioteca</button>
        <div className="library-search-box">
          <button type="button" className="find-games-button" onClick={tap(() => setBrowse('file'))} onMouseEnter={sounds.hover}>
            <span className="search-button-icon" aria-hidden="true">＋</span><span><strong>Adicionar jogo</strong><small>Escolher o .exe ou atalho do jogo</small></span>
          </button>
          <button type="button" className="find-games-button" onClick={tap(() => setBrowse('dir'))} onMouseEnter={sounds.hover}>
            <span className="search-button-icon" aria-hidden="true">▤</span><span><strong>Adicionar pasta</strong><small>Achar jogos dentro de uma pasta</small></span>
          </button>
          <label className="library-search">
            <span aria-hidden="true">⌕</span>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filtrar biblioteca" aria-label="Filtrar biblioteca" />
          </label>
        </div>
        <h3>Esse PC</h3>
        <button className={`library-filter ${platform === 'Todos' ? 'active' : ''}`} onClick={tap(() => setPlatform('Todos'))} onMouseEnter={sounds.hover}>▦ <span>Todos</span><b>{games.length}</b></button>
        <div className="pc-platforms" aria-label="Bibliotecas de plataformas">
          {PLATFORMS.slice(1).map((name) => (
            <button key={name} className={`pc-platform ${platform === name ? 'active' : ''}`} onClick={tap(() => setPlatform(name))} onMouseEnter={sounds.hover}>
              <span className="platform-mark">{MARK[name]}</span><span>{name}</span>
            </button>
          ))}
        </div>
      </aside>
      <div className="library-main">
        <div className="library-top"><h1>Biblioteca</h1><button className="sort-button" onClick={tap(toggleSort)} onMouseEnter={sounds.hover}>{sort === 'asc' ? 'Nome: A a Z' : 'Nome: Z a A'}　⌄</button></div>
        <div className="library-status">{platform === 'Todos' ? 'Jogos encontrados neste computador' : `Jogos da ${platform}`} <span>{shown.length}</span></div>
        {busy && <p className="library-msg" role="status">{busy}</p>}
        {msg && !busy && <p className="library-msg" role="status">{msg}</p>}
        <div className="library-grid">
          {shown.length === 0 && <p style={{ gridColumn: '1 / -1', opacity: 0.75, fontSize: 18 }}>Nenhum jogo encontrado. Use &quot;Adicionar jogo&quot; ou &quot;Adicionar pasta&quot;.</p>}
          {shown.map((g) => (
            <button key={g.id} className="library-card" data-id={g.id} onClick={tap(() => launch(g))} onContextMenu={(e) => { e.preventDefault(); setPicker(g) }} onMouseEnter={sounds.hover}>
              <div className={`library-cover ${g.cover ? 'has-cover' : ''}`}>
                <span>{g.name}</span>
                {g.cover && <img src={g.cover} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement?.classList.remove('has-cover') }} />}
                <small>▶</small>
              </div>
              <strong>{g.name}</strong>
              {profileOf(g) && <em className="lz-badge" style={{ position: 'static', alignSelf: 'flex-start' }}>🎮 {profileOf(g)}</em>}
            </button>
          ))}
        </div>
      </div>
      {browse && <FileBrowser mode={browse} sounds={sounds} onPick={pickPath} onClose={() => setBrowse(null)} onWindows={useWindows} />}
      {picker && <GameMenu game={picker} ds4={ds4} profile={profileOf(picker)} sounds={sounds}
        onProfile={(p) => choose(picker, p)} onRemove={() => remove(picker)} onClose={() => closePicker()} />}
    </section>
  )
}
