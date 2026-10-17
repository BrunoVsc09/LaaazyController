'use client'

// Janelinha "Aa" do topo (ao lado do controle): o tamanho do Laaazy e, no Edge, o dos sites e da
// legenda, sem entrar nas Configurações. ✕ numa linha passa para o próximo tamanho; ○ ou Fechar saem.
// A telinha de exemplo mostra o Início (linha do Laaazy) ou um site com legenda (linhas do Edge).
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { getLazy, type Settings } from '../lib/lazy-api'
import { homePreview, nextScreenScale, screenScaleMsg } from '../lib/screen-scale'
import { nextSiteScale, nextSubtitleSize, siteScaleMsg, sizeMenuItems, sizePreview, subtitleMsg, type SizeKey } from '../lib/tv-style'
import { setScreenScale } from '../hooks/useScreenScale'
import type { Sounds } from '../hooks/useSounds'

export default function TvSizeMenu({ onClose, sounds }: { onClose: () => void; sounds: Sounds }) {
  const lazy = getLazy()
  const [s, setS] = useState<Partial<Settings>>({})
  const [msg, setMsg] = useState('O Laaazy muda na hora; o Edge, da próxima vez que o serviço abrir.')
  const [showing, setShowing] = useState<SizeKey>('screenScale')

  useEffect(() => {
    lazy?.settings.get().then(setS)
    document.querySelector<HTMLElement>('.tv-size-menu button')?.focus()
    window.addEventListener('lz:close-modal', onClose)
    return () => window.removeEventListener('lz:close-modal', onClose)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const change = (key: SizeKey) => {
    sounds.click()
    setShowing(key)
    if (key === 'screenScale') {
      const v = nextScreenScale(s.screenScale ?? 100)
      setScreenScale(v) // a tela inteira muda na hora
      setS({ ...s, screenScale: v })
      setMsg(screenScaleMsg(v))
    } else if (key === 'siteScale') {
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
    <div className="lz-picker power-menu tv-size-menu" data-modal role="dialog" aria-label="Tamanho">
      <p><strong>Tamanho</strong><br />{msg}</p>
      {showing === 'screenScale' ? <HomePreview scale={s.screenScale ?? 100} /> : <EdgePreview s={s} />}
      {sizeMenuItems(s).map((i) => (
        <button key={i.key} type="button" className="lz-btn" onClick={() => change(i.key)} onFocus={() => setShowing(i.key)} onMouseEnter={sounds.hover}>{i.label}</button>
      ))}
      <button type="button" className="lz-btn" onClick={() => { sounds.click(); onClose() }} onMouseEnter={sounds.hover}>Fechar</button>
    </div>,
    host,
  )
}

// Miniatura do Início em 16:9: topo, destaque e uma fileira de cards, na proporção da tela de verdade
function HomePreview({ scale }: { scale: number }) {
  const p = homePreview(scale)
  const style = { '--h': p.header, '--t': p.title, '--x': p.text, backgroundImage: 'url(/ps4-bg.jpg)' } as React.CSSProperties
  return (
    <div className="tv-preview home-preview" style={style} aria-hidden>
      <div className="home-preview-top"><span className="home-preview-avatar" /><span>Bruno</span><span className="home-preview-clock">22:30</span></div>
      <div className="home-preview-hero"><b>Título do filme</b><span>Uma linha do resumo do destaque</span><i>▶ Assistir</i></div>
      <div className="tv-preview-row">{Array.from({ length: p.cards }, (_, i) => <div key={i} className="tv-preview-card" />)}</div>
    </div>
  )
}

// Telinha do Edge em 16:9: títulos e legenda na mesma proporção da tela de verdade
function EdgePreview({ s }: { s: Partial<Settings> }) {
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
