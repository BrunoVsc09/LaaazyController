'use client'

// "Explorar sem digitar": tipo, categoria, duração e ordem com botões, sem teclado e sem IA.
import { useEffect, useState } from 'react'
import opts from '../../shared/explore-options'
import { getLazy, type Title } from '../lib/lazy-api'
import type { Sounds } from '../hooks/useSounds'

type Sel = { kind: string; genre: string; duration: string; sort: string }
type Props = { sounds: Sounds; onPick: (t: Title) => void }

const ROWS: { key: keyof Sel; title: string; options: { id: string; label: string }[] }[] = [
  { key: 'kind', title: 'Tipo', options: opts.KINDS },
  { key: 'genre', title: 'Categoria', options: [{ id: '', label: 'Todas' }, ...opts.GENRES] },
  { key: 'duration', title: 'Duração (filmes)', options: opts.DURATIONS },
  { key: 'sort', title: 'Ordenar', options: opts.SORTS },
]

export default function ExplorePanel({ sounds, onPick }: Props) {
  const [sel, setSel] = useState<Sel>({ kind: 'any', genre: '', duration: 'any', sort: 'popular' })
  const [items, setItems] = useState<Title[]>([])
  const [msg, setMsg] = useState('')

  useEffect(() => {
    const lazy = getLazy()
    if (!lazy) return
    let alive = true
    setMsg('Procurando...')
    lazy.catalog.explore(sel).then((r) => {
      if (!alive) return
      setItems(r.items)
      setMsg(r.ok ? (r.items.length ? '' : 'Nada encontrado com esses filtros nos seus serviços.') : r.msg ?? '')
    })
    return () => { alive = false }
  }, [sel])

  const choose = (key: keyof Sel, id: string) => { sounds.click(); setSel((s) => ({ ...s, [key]: id })) }

  return (
    <section className="lz-explore" aria-label="Explorar sem digitar">
      <h2>Explorar sem digitar</h2>
      {ROWS.map((row) => (
        <div key={row.key} className="lz-row">
          <h3>{row.title}</h3>
          <div className="lz-strip">
            {row.options.map((o) => (
              <button key={o.id || 'all'} type="button" className={`lz-chip ${sel[row.key] === o.id ? 'on' : ''}`}
                aria-pressed={sel[row.key] === o.id} onClick={() => choose(row.key, o.id)} onFocus={sounds.hover}>{o.label}</button>
            ))}
          </div>
        </div>
      ))}
      {msg && <p className="lz-meta" role="status">{msg}</p>}
      {items.length > 0 && (
        <div className="lz-strip">
          {items.map((t) => (
            <button key={t.id} type="button" className="lz-title" style={t.backdrop || t.poster ? { backgroundImage: `url(${t.backdrop || t.poster})` } : undefined}
              onClick={() => { sounds.click(); onPick(t) }} onFocus={sounds.hover}><span>{t.title} · {t.kind}{t.year ? ` · ${t.year}` : ''}</span></button>
          ))}
        </div>
      )}
    </section>
  )
}
