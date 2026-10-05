'use client'

import { useEffect, useState } from 'react'
import { formatClock } from '../lib/header-info'
import { getLazy } from '../lib/lazy-api'
import { slidesFrom } from '../lib/screensaver'

const SLIDE_MS = 12_000

// Tela cheia com imagens dos filmes e séries em alta e o relógio. Qualquer botão volta (a página cuida disso).
export default function Screensaver() {
  const [slides, setSlides] = useState<{ title: string; image: string }[]>([])
  const [i, setI] = useState(0)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const lazy = getLazy()
    if (lazy) Promise.all([lazy.catalog.home(), lazy.myList.get()]).then(([h, list]) => setSlides(slidesFrom([...list, ...h.series, ...h.films, ...(h.animes ?? [])])))
    const t = window.setInterval(() => { setI((x) => x + 1); setNow(new Date()) }, SLIDE_MS)
    return () => window.clearInterval(t)
  }, [])

  const slide = slides.length ? slides[i % slides.length] : null
  return (
    <div className="lz-saver" aria-hidden="true">
      {slide && <div key={slide.image} className="lz-saver-img" style={{ backgroundImage: `url(${slide.image})` }} />}
      <div className="lz-saver-info">
        <strong>{formatClock(now)}</strong>
        {slide && <span>{slide.title}</span>}
      </div>
    </div>
  )
}
