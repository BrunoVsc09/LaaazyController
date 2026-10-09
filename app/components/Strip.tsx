'use client'

// Fileira que anda para o lado (Início e Buscar). Com o mouse aparecem setas ‹ › nas pontas;
// usando o controle elas somem (o D-pad já leva a fileira junto com o foco).
// As setas não são <button>: o D-pad e o foco que segue o mouse não param nelas.
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { stripEnds, stripTarget } from '../lib/focus'

type Ends = { prev: boolean; next: boolean }

export default function Strip({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [ends, setEnds] = useState<Ends>({ prev: false, next: false })
  const size = () => {
    const el = ref.current
    return el && { left: el.scrollLeft, width: el.clientWidth, total: el.scrollWidth }
  }
  const measure = () => {
    const s = size()
    if (!s) return
    const n = stripEnds(s)
    setEnds((cur) => (cur.prev === n.prev && cur.next === n.next ? cur : n))
  }
  // Mede de novo quando os cards mudam (a cada render) e quando a janela muda de tamanho
  useEffect(measure)
  useEffect(() => {
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const step = (dir: 1 | -1) => {
    const s = size()
    if (s) ref.current?.scrollTo({ left: stripTarget(s, dir), behavior: 'smooth' })
  }

  return (
    <div className="lz-strip-wrap">
      <div className="lz-strip" ref={ref} onScroll={measure}>{children}</div>
      {ends.prev && <div className="lz-strip-arrow prev" role="button" aria-label="Voltar a fileira" onClick={() => step(-1)}>‹</div>}
      {ends.next && <div className="lz-strip-arrow next" role="button" aria-label="Avançar a fileira" onClick={() => step(1)}>›</div>}
    </div>
  )
}
