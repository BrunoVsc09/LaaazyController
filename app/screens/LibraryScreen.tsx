'use client'

import { useEffect, useState } from 'react'
import { getLazy, type Game } from '../lib/lazy-api'
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
  const [busy, setBusy] = useState('')
  const [msg, setMsg] = useState('')
  const [sort, setSort] = useState<Sort>('asc')

  const toggleSort = () => {
    const next = nextSort(sort)
    setSort(next)
    lazy?.settings.set('librarySort', next)
  }

  const refresh = async (fresh = false) => { if (lazy) setGames(await lazy.games.list(fresh ? { fresh: true } : undefined)) }

  // Varrer uma pasta grande demora: mostra que está trabalhando e quantos jogos entraram
  const add = async (kind: 'addExe' | 'addFolder') => {
    if (!lazy) return
    setMsg('')
    setBusy(kind === 'addFolder' ? 'Procurando jogos na pasta...' : 'Adicionando...')
    try {
      const r = await lazy.games[kind]()
      setMsg(r.msg)
      await refresh(true)
    } finally { setBusy('') }
  }

  const launch = async (g: Game) => {
    if (!lazy) return
    const r = await lazy.games.launch(g.id)
    if (!r.ok) { setMsg(r.msg); refresh(true) }
  }

  const remove = (g: Game) => {
    if (g.platform !== 'Meu PC' || !window.confirm(`Remover "${g.name}" da lista?`)) return
    lazy?.games.remove(g.id).then(() => refresh(true))
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
          <button type="button" className="find-games-button" onClick={tap(() => add('addExe'))} onMouseEnter={sounds.hover}>
            <span className="search-button-icon" aria-hidden="true">＋</span><span><strong>Adicionar jogo</strong><small>Escolher o .exe ou atalho do jogo</small></span>
          </button>
          <button type="button" className="find-games-button" onClick={tap(() => add('addFolder'))} onMouseEnter={sounds.hover}>
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
            <button key={g.id} className="library-card" onClick={tap(() => launch(g))} onContextMenu={(e) => { e.preventDefault(); remove(g) }} onMouseEnter={sounds.hover}>
              <div className={`library-cover ${g.cover ? 'has-cover' : ''}`}>
                <span>{g.name}</span>
                {g.cover && <img src={g.cover} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement?.classList.remove('has-cover') }} />}
                <small>▶</small>
              </div>
              <strong>{g.name}</strong>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
