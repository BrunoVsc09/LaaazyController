'use client'

// "Parecido com este" (△ num título do Início): a IA acha títulos com o mesmo clima e eles viram uma
// fileira no topo. Os avisos vão para o destaque (setMsg), sempre à vista.
import { useEffect, useRef, useState, type MutableRefObject } from 'react'
import { similarSource, SIMILAR_MSG, type TitleRow } from '../lib/home-model'
import { getLazy, type Title } from '../lib/lazy-api'

export type Similar = { source: Title; mood: string; items: Title[]; loading: boolean }

export function useSimilar(rowsRef: MutableRefObject<TitleRow[]>, setMsg: (msg: string) => void): Similar | null {
  const [similar, setSimilar] = useState<Similar | null>(null)
  const similarRef = useRef(similar)
  similarRef.current = similar
  useEffect(() => {
    const lazy = getLazy()
    const onTriangle = async () => {
      if (!lazy) return
      const id = (document.activeElement as HTMLElement | null)?.closest<HTMLElement>('.lz-title')?.dataset.id
      const source = similarSource(id, [similarRef.current?.items ?? [], ...rowsRef.current.map((r) => r.items)])
      if (!source) { setMsg(SIMILAR_MSG.pick); return }
      setSimilar({ source, mood: '', items: [], loading: true })
      setMsg(SIMILAR_MSG.searching(source.title))
      const r = await lazy.ai.similar(source)
      if (!r.ok || !r.items.length) { setSimilar(null); setMsg(r.msg || `Não achei títulos parecidos com "${source.title}".`); return }
      setMsg('')
      setSimilar({ source, mood: r.mood ?? '', items: r.items, loading: false })
    }
    window.addEventListener('lz:triangle', onTriangle)
    return () => window.removeEventListener('lz:triangle', onTriangle)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  // Parecidos prontos: o foco vai para o 1º deles depois que a fileira foi desenhada (antes, um
  // setTimeout chegava antes dos cards e o foco ficava no título de origem)
  const ready = similar && !similar.loading ? similar.source.id : ''
  useEffect(() => {
    const first = ready ? document.querySelector<HTMLElement>('.lz-similar .lz-title') : null
    first?.focus()
    first?.scrollIntoView({ block: 'center', inline: 'nearest' })
  }, [ready])
  return similar
}
