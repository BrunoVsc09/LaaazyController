'use client'

// Depois que o Laaazy se atualiza: "Novidades da versão" com a mascote, uma vez por versão.
// ✕ em "Entendi" ou ○ fecham; os títulos vêm do CHANGELOG (regras em electron/core/release-notes).
import { useEffect, useRef, useState } from 'react'
import { getLazy, type ReleaseNotes } from '../lib/lazy-api'
import { notesDate, notesHeading, sectionIcon } from '../lib/release-notes'
import type { Sounds } from '../hooks/useSounds'

export default function ReleaseNotesDialog({ sounds }: { sounds: Sounds }) {
  const lazy = getLazy()
  const [notes, setNotes] = useState<ReleaseNotes | null>(null)
  const open = useRef(false)
  open.current = !!notes
  // Ao fechar, a borda volta para onde estava antes da janela aparecer
  const before = useRef<HTMLElement | null>(null)
  const close = () => {
    if (!open.current) return
    open.current = false
    setNotes(null)
    lazy?.notes.seen()
    window.setTimeout(() => (before.current?.isConnected ? before.current : document.querySelector<HTMLElement>('.ps4-screen button'))?.focus(), 0)
  }

  useEffect(() => {
    lazy?.notes.pending().then((n) => { if (n && n.sections.length) setNotes(n) })
    window.addEventListener('lz:close-modal', close)
    return () => window.removeEventListener('lz:close-modal', close)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!notes) return
    before.current = document.activeElement as HTMLElement | null
    document.querySelector<HTMLElement>('.lz-notes button')?.focus()
  }, [notes])

  if (!notes) return null
  return (
    <div className="lz-notes" data-modal role="dialog" aria-label={notesHeading(notes.version)}>
      <img className="lz-notes-art" src="novidades.webp" alt="" />
      <div className="lz-notes-body">
        <h2>{notesHeading(notes.version)}</h2>
        {notesDate(notes.date) && <p className="lz-notes-date">{notesDate(notes.date)}</p>}
        <div className="lz-notes-list">
          {notes.sections.map((s) => (
            <section key={s.title}>
              <h3>{sectionIcon(s.title)} {s.title}</h3>
              <ul>{s.items.map((i) => <li key={i}>{i}</li>)}</ul>
            </section>
          ))}
        </div>
        <button type="button" className="lz-btn" onClick={() => { sounds.click(); close() }} onMouseEnter={sounds.hover}>Entendi</button>
      </div>
    </div>
  )
}
