'use client'

import { useEffect, useState } from 'react'
import streaming from '../../shared/streaming'
import AppIcon from '../components/AppIcon'
import Strip from '../components/Strip'
import ExplorePanel from '../components/ExplorePanel'
import { CATALOG, type Card } from '../lib/catalog'
import { getLazy, type Game, type Title } from '../lib/lazy-api'
import { searchLocal } from '../lib/search'
import type { Sounds } from '../hooks/useSounds'

type Props = { sounds: Sounds; onActivate: (card: Card) => void; onBack: () => void }
const urlOf = (label: string) => streaming.find((s) => s.label === label)?.url

export default function SearchScreen({ sounds, onActivate, onBack }: Props) {
  const lazy = getLazy()
  const [query, setQuery] = useState('')
  const [games, setGames] = useState<Game[]>([])
  const [titles, setTitles] = useState<Title[]>([])
  const [msg, setMsg] = useState('')

  useEffect(() => {
    lazy?.games.list().then(setGames)
    document.querySelector<HTMLElement>('.lz-search input')?.focus()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Espera parar de digitar antes de perguntar ao TMDB
  useEffect(() => {
    if (!lazy) return
    const t = window.setTimeout(async () => {
      const r = await lazy.catalog.search(query)
      setTitles(r.items)
      setMsg(r.ok || query.trim().length < 2 ? '' : r.msg ?? '')
    }, 400)
    return () => window.clearTimeout(t)
  }, [query]) // eslint-disable-line react-hooks/exhaustive-deps

  const local = searchLocal(query, { cards: CATALOG, games })

  const playGame = async (g: Game) => {
    const r = await lazy?.games.launch(g.id)
    if (r && !r.ok) setMsg(r.msg)
  }
  const watch = async (t: Title) => {
    if (!lazy) return
    setMsg('Procurando onde assistir...')
    const services = await lazy.catalog.where(t.id)
    const url = services[0] && urlOf(services[0])
    if (!url) { setMsg(`"${t.title}" não está nos seus serviços de streaming no Brasil.`); return }
    setMsg((await lazy.open(url, services[0])) || `Abrindo ${services[0]}...`)
  }
  const tap = (fn: () => void) => () => { sounds.click(); fn() }
  const empty = query.trim().length >= 2 && !local.apps.length && !local.games.length && !titles.length

  return (
    <section className="lz-apps lz-search" aria-label="Buscar">
      <label className="lz-search-box">
        <span aria-hidden="true">⌕</span>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar filmes, séries, jogos e apps" aria-label="Buscar" />
      </label>
      {msg && <p className="lz-meta" role="status">{msg}</p>}
      {empty && <p className="lz-meta">Nada encontrado para &quot;{query}&quot;.</p>}

      {local.apps.length > 0 && (
        <div className="lz-row"><h2>Apps</h2>
          <Strip>
            {local.apps.map((c) => (
              <button key={c.label} type="button" className="lz-app" style={{ background: c.bg ?? 'rgba(255,255,255,.14)', color: c.fg ?? '#fff' }}
                onClick={tap(() => onActivate(c))} onFocus={sounds.hover}><AppIcon card={c} size={36} /><span>{c.label}</span></button>
            ))}
          </Strip>
        </div>
      )}
      {local.games.length > 0 && (
        <div className="lz-row"><h2>Jogos</h2>
          <Strip>
            {local.games.map((g) => (
              <button key={g.id} type="button" className="lz-title" style={g.cover ? { backgroundImage: `url(${g.cover})` } : undefined}
                onClick={tap(() => playGame(g))} onFocus={sounds.hover}><span>{g.name} · {g.platform}</span></button>
            ))}
          </Strip>
        </div>
      )}
      {titles.length > 0 && (
        <div className="lz-row"><h2>Filmes e séries</h2>
          <Strip>
            {titles.map((t) => (
              <button key={t.id} type="button" className="lz-title" style={t.backdrop || t.poster ? { backgroundImage: `url(${t.backdrop || t.poster})` } : undefined}
                onClick={tap(() => watch(t))} onFocus={sounds.hover}><span>{t.title} · {t.kind}{t.year ? ` · ${t.year}` : ''}</span></button>
            ))}
          </Strip>
        </div>
      )}
      <ExplorePanel sounds={sounds} onPick={watch} />
      <button type="button" className="lz-btn" onClick={onBack}>‹ Voltar</button>
    </section>
  )
}
