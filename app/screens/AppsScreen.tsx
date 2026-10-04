'use client'

import AppIcon from '../components/AppIcon'
import { CATALOG, type Card } from '../lib/catalog'
import { appsGrid } from '../lib/home-model'
import type { Sounds } from '../hooks/useSounds'

type Props = { pinned: string[]; sounds: Sounds; onActivate: (card: Card) => void; onTogglePin: (label: string) => void }

export default function AppsScreen({ pinned, sounds, onActivate, onTogglePin }: Props) {
  return (
    <section className="lz-apps" aria-label="Apps">
      <h1 className="lz-heading">Seus apps <small>{pinned.length} fixados no Início</small></h1>
      <div className="lz-apps-grid">
        {appsGrid(CATALOG).map((card) => {
          const on = pinned.includes(card.label)
          return (
            <div key={card.label} className="lz-app-card">
              <button type="button" className="lz-app-tile" style={{ background: card.bg ?? 'rgba(255,255,255,.14)', color: card.fg ?? '#fff' }}
                onClick={() => { sounds.click(); onActivate(card) }} onFocus={sounds.hover}>
                <AppIcon card={card} size={44} /><span>{card.label}</span>
              </button>
              <button type="button" className={`lz-pin ${on ? 'on' : ''}`} aria-pressed={on}
                onClick={() => { sounds.click(); onTogglePin(card.label) }}>
                {on ? '★ Fixado no Início' : '☆ Fixar no Início'}
              </button>
            </div>
          )
        })}
      </div>
    </section>
  )
}
