'use client'

import { useEffect, useRef } from 'react'
import { BRAND } from '@/lib/brand-icons'
import { CATALOG, type Card } from '../lib/catalog'
import type { Sounds } from '../hooks/useSounds'

const START_ICON = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-cPxESVJHgzFRcqFKZmiuX06C9PDPjS.png'

type Props = { selected: number; active: boolean; sounds: Sounds; onSelect: (i: number) => void; onActivate: (card: Card) => void }

function TileArt({ card }: { card: Card }) {
  if (card.brand && BRAND[card.brand]) {
    return <svg viewBox="0 0 24 24" className="tile-icon" fill={card.fg || '#fff'} aria-hidden="true"><path d={BRAND[card.brand]} /></svg>
  }
  if (card.icon === 'hydra') return <img className="hydra-icon" src="/hydra-icon.png" alt="" />
  const Icon = card.icon
  return <Icon className="tile-icon" strokeWidth={1.35} />
}

export default function HomeScreen({ selected, active, sounds, onSelect, onActivate }: Props) {
  const tiles = useRef<(HTMLButtonElement | null)[]>([])
  // Foco segue o card selecionado (mas não rouba o foco do cabeçalho)
  useEffect(() => {
    if (active && !document.querySelector('.ps4-header :focus')) tiles.current[selected]?.focus()
  }, [selected, active])

  return (
    <section className="ps4-content" aria-label="Aplicativos e jogos">
      <div className="cards-scroll w-full overflow-visible px-8 py-12 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
        <div className="ps4-tiles flex flex-row gap-[100px] overflow-x-auto pb-8 scrollbar-none" role="list" style={{ scrollbarWidth: 'none' }}>
          {CATALOG.map((card, index) => {
            const isSelected = index === selected
            return (
              <div key={card.label} className="ps4-tile-group group flex w-[150px] shrink-0 flex-col items-start focus-within:z-10 hover:z-10">
                <button
                  ref={(el) => { tiles.current[index] = el }}
                  type="button" role="listitem" aria-label={card.label}
                  className={`ps4-tile shrink-0 ${card.kind} ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => { sounds.click(); onSelect(index); onActivate(card) }}
                  onMouseEnter={() => onSelect(index)}
                  onFocus={sounds.hover}
                >
                  <div className="tile-image" style={card.bg ? { background: card.bg } : undefined}>
                    <TileArt card={card} />
                    <span className="tile-label" style={card.fg === '#000' ? { color: '#000' } : undefined}>{card.label}</span>
                  </div>
                </button>
                <div className={`start-panel transition-opacity duration-200 ${isSelected ? 'opacity-100' : 'opacity-0'}`} aria-hidden="true">
                  <img src={START_ICON} alt="" /><span className="start-name">{card.label}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
