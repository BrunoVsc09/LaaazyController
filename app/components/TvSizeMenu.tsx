'use client'

// Janelinha "Aa" do topo (ao lado do controle): tamanho dos sites e da legenda nos serviços do Edge,
// sem entrar nas Configurações. ✕ numa linha passa para o próximo tamanho; ○ ou Fechar saem.
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { getLazy, type Settings } from '../lib/lazy-api'
import { nextSiteScale, nextSubtitleSize, siteScaleMsg, sizeMenuItems, sizePreview, subtitleMsg, type SizeKey } from '../lib/tv-style'
import type { Sounds } from '../hooks/useSounds'

export default function TvSizeMenu({ onClose, sounds }: { onClose: () => void; sounds: Sounds }) {
  const lazy = getLazy()
  const [s, setS] = useState<Partial<Settings>>({})
  const [msg, setMsg] = useState('Vale da próxima vez que o serviço abrir no Edge.')

  useEffect(() => {
    lazy?.settings.get().then(setS)
    document.querySelector<HTMLElement>('.tv-size-menu button')?.focus()
    window.addEventListener('lz:close-modal', onClose)
    return () => window.removeEventListener('lz:close-modal', onClose)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const change = (key: SizeKey) => {
    sounds.click()
    if (key === 'siteScale') {
      const v = nextSiteScale(s.siteScale ?? 100)
      lazy?.settings.set(key, v)
      setS({ ...s, siteScale: v })
      setMsg(siteScaleMsg(v))
    } else {
      const v = nextSubtitleSize(s.subtitleSize ?? 'grande')
      lazy?.settings.set(key, v)
      setS({ ...s, subtitleSize: v })
      setMsg(subtitleMsg(v))
    }
  }

  // Desenhada direto na tela (fora do topo): o topo fica numa camada abaixo do destaque do Início
  const host = typeof document !== 'undefined' ? document.querySelector('.ps4-screen') : null
  if (!host) return null
  return createPortal(
    <div className="lz-picker power-menu tv-size-menu" data-modal role="dialog" aria-label="Tamanho no Edge">
      <p><strong>Tamanho no Edge</strong><br />{msg}</p>
      <Preview s={s} />
      {sizeMenuItems(s).map((i) => (
        <button key={i.key} type="button" className="lz-btn" onClick={() => change(i.key)} onMouseEnter={sounds.hover}>{i.label}</button>
      ))}
      <button type="button" className="lz-btn" onClick={() => { sounds.click(); onClose() }} onMouseEnter={sounds.hover}>Fechar</button>
    </div>,
    host,
  )
}

// Telinha de exemplo em 16:9: títulos e legenda na mesma proporção da tela de verdade
function Preview({ s }: { s: Partial<Settings> }) {
  const p = sizePreview(s)
  const style = { '--t': p.title, '--s': p.subtitle, backgroundImage: 'url(/ps4-bg.jpg)' } as React.CSSProperties
  return (
    <div className="tv-preview" style={style} aria-hidden>
      <div className="tv-preview-row">
        {Array.from({ length: p.cards }, (_, i) => <div key={i} className="tv-preview-card"><span>Título {i + 1}</span></div>)}
      </div>
      <p className="tv-preview-sub">Assim fica a legenda</p>
    </div>
  )
}
