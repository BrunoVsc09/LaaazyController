'use client'

import { useEffect, useState } from 'react'
import streaming from '../../shared/streaming'
import AppIcon from '../components/AppIcon'
import { CATALOG, type Card } from '../lib/catalog'
import { buildRows, heroInfo, pinnedCards } from '../lib/home-model'
import { getLazy, type CatalogHome, type Game, type Title } from '../lib/lazy-api'
import type { Sounds } from '../hooks/useSounds'

type Props = { pinned: string[]; sounds: Sounds; onActivate: (card: Card) => void; onOpenSettings: () => void }

const urlOf = (label: string) => streaming.find((s) => s.label === label)?.url
const bg = (t: Title) => (t.backdrop || t.poster ? { backgroundImage: `url(${t.backdrop || t.poster})` } : undefined)

export default function HomeScreen({ pinned, sounds, onActivate, onOpenSettings }: Props) {
  const lazy = getLazy()
  const [data, setData] = useState<CatalogHome | null>(null)
  const [hero, setHero] = useState<Title | null>(null)
  const [msg, setMsg] = useState('')
  const [recent, setRecent] = useState<Game[]>([])
  const [myList, setMyList] = useState<Title[]>([])

  useEffect(() => {
    if (!lazy) return
    Promise.all([lazy.catalog.home(), lazy.myList.get()]).then(([d, list]) => {
      setData(d); setMyList(list)
      setHero(list[0] ?? d.series[0] ?? d.films[0] ?? null)
    })
    lazy.games.recent().then(setRecent)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const rows = data ? buildRows({ ...data, myList }) : []
  const inList = !!hero && myList.some((x) => x.id === hero.id)
  const toggleList = async () => {
    if (!lazy || !hero) return
    const r = await lazy.myList.toggle(hero)
    if (!r.ok) { setMsg(r.msg ?? ''); return }
    setMyList(await lazy.myList.get())
  }
  const play = async (g: Game) => {
    const r = await lazy?.games.launch(g.id)
    if (r && !r.ok) setMsg(r.msg)
  }
  const info = hero ? heroInfo(hero) : null

  // Título salvo pela busca não tem serviço: pergunta ao TMDB onde ele está
  const watch = async () => {
    if (!lazy || !hero) return
    const service = info?.primary ?? (await lazy.catalog.where(hero.id))[0]
    const url = service && urlOf(service)
    if (!url) { setMsg(`"${hero.title}" não está nos seus serviços de streaming no Brasil.`); return }
    setMsg((await lazy.open(url, service)) || '')
  }
  const trailer = async () => {
    if (!lazy || !hero) return
    const key = await lazy.catalog.trailer(hero.id)
    if (!key) { setMsg('Não achei trailer para este título.'); return }
    setMsg((await lazy.open(`https://www.youtube.com/watch?v=${key}`, 'YouTube')) || '')
  }
  const tap = (fn: () => void) => () => { sounds.click(); fn() }

  return (
    <section className="lz-home" aria-label="Início">
      {hero && info && (
        <div className="lz-hero">
          <div>
            <div className="lz-meta">{info.meta}</div>
            <h1>{hero.title}</h1>
            {hero.overview && <p className="lz-overview">{hero.overview}</p>}
            <div className="lz-actions">
              <button type="button" className="lz-btn primary" onClick={tap(watch)} onMouseEnter={sounds.hover}>▶ {info.primary ? `Assistir na ${info.primary}` : 'Onde assistir'}</button>
              <button type="button" className="lz-btn" onClick={tap(trailer)} onMouseEnter={sounds.hover}>Trailer</button>
              <button type="button" className="lz-btn" aria-pressed={inList} onClick={tap(toggleList)} onMouseEnter={sounds.hover}>{inList ? '✓ Na Minha lista' : '＋ Minha lista'}</button>
            </div>
            {msg && <p className="lz-meta" role="status">{msg}</p>}
          </div>
          <div className="lz-hero-media" style={bg(hero)} aria-hidden="true" />
        </div>
      )}

      <div className="lz-row">
        <h2>Seus apps</h2>
        <div className="lz-strip">
          {pinnedCards(CATALOG, pinned).map((card) => (
            <button key={card.label} type="button" className="lz-app" style={{ background: card.bg ?? 'rgba(255,255,255,.14)', color: card.fg ?? '#fff' }}
              aria-label={card.label} onClick={() => { sounds.click(); onActivate(card) }} onFocus={sounds.hover}>
              <AppIcon card={card} size={36} /><span>{card.label}</span>
            </button>
          ))}
        </div>
      </div>

      {recent.length > 0 && (
        <div className="lz-row">
          <h2>Continuar jogando</h2>
          <div className="lz-strip">
            {recent.map((g) => (
              <button key={g.id} type="button" className="lz-title" style={g.cover ? { backgroundImage: `url(${g.cover})` } : undefined}
                onClick={tap(() => play(g))} onFocus={sounds.hover}><span>{g.name}</span></button>
            ))}
          </div>
        </div>
      )}

      {data && !data.configured && (
        <div className="lz-empty">
          Para ver filmes e séries em alta nos seus apps, configure a chave do TMDB.{' '}
          <button type="button" className="lz-btn" onClick={tap(onOpenSettings)}>Abrir Configurações</button>
        </div>
      )}
      {data && data.configured && data.msg && <div className="lz-empty" role="status">{data.msg}</div>}

      {rows.map((row) => (
        <div key={row.id} className="lz-row">
          <h2>{row.title}</h2>
          <div className="lz-strip">
            {row.items.map((t) => (
              <button key={t.id} type="button" className="lz-title" style={bg(t)} aria-label={`${t.title} (${t.kind})`}
                onFocus={() => { setHero(t); setMsg(''); sounds.hover() }} onClick={tap(watch)}>
                <span>{t.title}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}
