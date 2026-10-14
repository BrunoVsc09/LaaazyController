'use client'

// Depois que o Laaazy se atualiza: "Novidades da versão" com a mascote, uma vez por versão.
// ↓/↑ rolam; só fecha depois de chegar ao fim (rodapé com os avatares): aí ✕ em "Entendi" ou ○.
// O "Entendi" nunca fica disabled: sem foco nele, o ✕ clicaria no que está atrás da janela.
import { useEffect, useRef, useState } from 'react'
import { useGamepad } from '../hooks/useGamepad'
import { getLazy, type ReleaseNotes } from '../lib/lazy-api'
import { holdStep, type Hold } from '../lib/nav-repeat'
import { footerAvatars, notesDate, notesHeading, reachedEnd, sectionIcon } from '../lib/release-notes'
import type { Sounds } from '../hooks/useSounds'

const SCROLL_STEP = 140
const NO_HOLD: Hold = { dir: '', steps: 0, at: 0 }

export default function ReleaseNotesDialog({ sounds }: { sounds: Sounds }) {
  const lazy = getLazy()
  const [notes, setNotes] = useState<ReleaseNotes | null>(null)
  const [avatars, setAvatars] = useState<{ id: string; src: string }[]>([])
  const [atEnd, setAtEnd] = useState(false)
  const list = useRef<HTMLDivElement>(null)
  const hold = useRef<Hold>(NO_HOLD)
  const now = useRef({ open: false, atEnd: false })
  now.current = { open: !!notes, atEnd }
  // Ao fechar, a borda volta para onde estava antes da janela aparecer
  const before = useRef<HTMLElement | null>(null)
  const close = () => {
    if (!now.current.open || !now.current.atEnd) return
    now.current.open = false
    setNotes(null)
    lazy?.notes.seen()
    window.setTimeout(() => (before.current?.isConnected ? before.current : document.querySelector<HTMLElement>('.ps4-screen button'))?.focus(), 0)
  }
  const checkEnd = () => { if (list.current && reachedEnd(list.current)) setAtEnd(true) }

  useEffect(() => {
    lazy?.notes.pending().then((n) => { if (n && n.sections.length) setNotes(n) })
    lazy?.user.get().then((u) => setAvatars(footerAvatars(u.avatars)))
    window.addEventListener('lz:close-modal', close)
    // Janela mudou de tamanho e agora tudo cabe: nada rola, então confere o fim aqui também
    window.addEventListener('resize', checkEnd)
    return () => { window.removeEventListener('lz:close-modal', close); window.removeEventListener('resize', checkEnd) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!notes) return
    before.current = document.activeElement as HTMLElement | null
    document.querySelector<HTMLElement>('.lz-notes-ok')?.focus()
    requestAnimationFrame(checkEnd) // coube tudo sem rolar: já está no fim
  }, [notes, avatars]) // eslint-disable-line react-hooks/exhaustive-deps

  // ↓/↑ do controle rolam a lista (segurando, acelera como na navegação)
  useGamepad(({ dy }) => {
    if (!now.current.open || !list.current) return
    const r = holdStep(hold.current, dy ? String(dy) : '', performance.now())
    hold.current = r.hold
    if (r.step) { list.current.scrollBy({ top: dy * SCROLL_STEP }); checkEnd() }
  })

  if (!notes) return null
  return (
    <div className="lz-notes" data-modal role="dialog" aria-label={notesHeading(notes.version)}>
      <img className="lz-notes-art" src="novidades.webp" alt="" />
      <div className="lz-notes-body">
        <h2>{notesHeading(notes.version)}</h2>
        {notesDate(notes.date) && <p className="lz-notes-date">{notesDate(notes.date)}</p>}
        <div className="lz-notes-list" ref={list} onScroll={checkEnd}>
          {notes.sections.map((s) => (
            <section key={s.title}>
              <h3>{sectionIcon(s.title)} {s.title}</h3>
              <ul>{s.items.map((i) => <li key={i}>{i}</li>)}</ul>
            </section>
          ))}
          {avatars.length > 0 && (
            <footer className="lz-notes-avatars">
              <h3>🎨 Avatares</h3>
              <div>{avatars.map((a) => <img key={a.id} src={a.src} alt="" />)}</div>
            </footer>
          )}
        </div>
        <button type="button" className={`lz-btn lz-notes-ok ${atEnd ? '' : 'is-waiting'}`} aria-disabled={!atEnd}
          onClick={() => { if (!atEnd) return; sounds.click(); close() }} onMouseEnter={sounds.hover}>
          {atEnd ? 'Entendi' : 'Role até o fim ↓'}
        </button>
      </div>
    </div>
  )
}
