'use client'

// Navegador de pastas do Laaazy: escolher o .exe de um jogo ou uma pasta de jogos com o controle.
import { useEffect, useState } from 'react'
import { getLazy, type FsEntry, type FsList } from '../lib/lazy-api'
import type { Sounds } from '../hooks/useSounds'

type Props = { mode: 'file' | 'dir'; sounds: Sounds; onPick: (path: string) => void; onClose: () => void; onWindows: () => void }

const ICON: Record<FsEntry['type'], string> = { dir: '📁', place: '⭐', drive: '💽', exe: '🎮', lnk: '🔗' }

export default function FileBrowser({ mode, sounds, onPick, onClose, onWindows }: Props) {
  const [dir, setDir] = useState('')
  const [list, setList] = useState<FsList | null>(null)

  useEffect(() => {
    let alive = true
    getLazy()?.fs.list(dir, mode).then((l) => {
      if (!alive) return
      setList(l)
      window.setTimeout(() => document.querySelector<HTMLElement>('.lz-browser .lz-entry, .lz-browser button')?.focus(), 0)
    })
    return () => { alive = false }
  }, [dir, mode])

  const open = (e: FsEntry) => {
    sounds.click()
    if (e.type === 'exe' || e.type === 'lnk') onPick(e.path)
    else setDir(e.path)
  }
  const tap = (fn: () => void) => () => { sounds.click(); fn() }

  return (
    <div className="lz-browser" data-modal role="dialog" aria-label={mode === 'file' ? 'Escolher o jogo' : 'Escolher a pasta dos jogos'}>
      <div className="lz-browser-head">
        <strong>{mode === 'file' ? 'Escolha o jogo (.exe ou atalho)' : 'Escolha a pasta dos jogos'}</strong>
        <span>{dir || 'Atalhos e discos'}</span>
      </div>
      <div className="lz-browser-actions">
        {dir && <button type="button" className="lz-btn" onClick={tap(() => setDir(list?.parent ?? ''))}>‹ Pasta de cima</button>}
        {mode === 'dir' && dir && <button type="button" className="lz-btn primary" onClick={tap(() => onPick(dir))}>✓ Escolher esta pasta</button>}
        <button type="button" className="lz-btn" onClick={tap(onWindows)}>Janela do Windows (mouse)</button>
        <button type="button" className="lz-btn" onClick={tap(onClose)}>Cancelar</button>
      </div>
      {list && !list.ok && <p className="lz-meta" role="status">{list.msg}</p>}
      {list && list.ok && list.entries.length === 0 && <p className="lz-meta">{mode === 'file' ? 'Nenhuma pasta ou jogo aqui.' : 'Nenhuma pasta aqui.'}</p>}
      <div className="lz-browser-list">
        {list?.entries.map((e) => (
          <button key={e.path} type="button" className="lz-btn lz-entry" onClick={() => open(e)} onFocus={sounds.hover}>
            <span aria-hidden="true">{ICON[e.type]}</span> {e.name}
          </button>
        ))}
      </div>
    </div>
  )
}
