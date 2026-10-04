'use client'

import { useEffect, useState } from 'react'
import streaming from '../../shared/streaming'
import AppIcon from '../components/AppIcon'
import { CATALOG, type Card } from '../lib/catalog'
import { buildRows, heroInfo, pinnedCards } from '../lib/home-model'
import { getLazy, type CatalogHome, type Title } from '../lib/lazy-api'
import type { Sounds } from '../hooks/useSounds'

type Props = { pinned: string[]; sounds: Sounds; onActivate: (card: Card) => void; onOpenSettings: () => void }

const urlOf = (label: string) => streaming.find((s) => s.label === label)?.url
const bg = (t: Title) => (t.backdrop || t.poster ? { backgroundImage: `url(${t.backdrop || t.poster})` } : undefined)

export default function HomeScreen({ pinned, sounds, onActivate, onOpenSettings }: Props) {
  const lazy = getLazy()
  const [data, setData] = useState<CatalogHome | null>(null)
  const [hero, setHero] = useState<Title | null>(null)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    lazy?.catalog.home().then((d) => { setData(d); setHero(d.series[0] ?? d.films[0] ?? null) })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const rows = data ? buildRows(data) : []
  const info = hero ? heroInfo(hero) : null

  const watch = async () => {
    if (!lazy || !info?.primary) return
    const url = urlOf(info.primary)
    if (url) setMsg((await lazy.open(url, info.primary)) || '')
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
              {info.primary && <button type="button" className="lz-btn primary" onClick={tap(watch)} onMouseEnter={sounds.hover}>▶ Assistir na {info.primary}</button>}
              <button type="button" className="lz-btn" onClick={tap(trailer)} onMouseEnter={sounds.hover}>Trailer</button>
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
