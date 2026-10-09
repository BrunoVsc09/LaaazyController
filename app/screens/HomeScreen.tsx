'use client'

import { useEffect, useRef, useState } from 'react'
import streaming from '../../shared/streaming'
import AppIcon from '../components/AppIcon'
import { CATALOG, type Card } from '../lib/catalog'
import { buildRows, heroInfo, pinnedCards, shuffled, type EpisodeNews } from '../lib/home-model'
import { getLazy, type CatalogHome, type Game, type Title } from '../lib/lazy-api'
import { YT_ORIGIN, nextTitleId, playerCommand, playerEvent, previewStep, titleFocus, trailerEmbedUrl } from '../lib/trailer'
import type { Sounds } from '../hooks/useSounds'
import { useSimilar } from '../hooks/useSimilar'

type Props = { pinned: string[]; sounds: Sounds; onActivate: (card: Card) => void; onOpenSettings: () => void }

const urlOf = (label: string) => streaming.find((s) => s.label === label)?.url
const PER_ROW = 30 // títulos sorteados por fileira, de uma lista de até 100
const bg = (t: Title) => (t.backdrop || t.poster ? { backgroundImage: `url(${t.backdrop || t.poster})` } : undefined)

export default function HomeScreen({ pinned, sounds, onActivate, onOpenSettings }: Props) {
  const lazy = getLazy()
  const [data, setData] = useState<CatalogHome | null>(null)
  // Fileiras sorteadas: muda a cada abertura do Início e no "Outros títulos"
  const [mix, setMix] = useState<{ films: Title[]; series: Title[]; animes: Title[] }>({ films: [], series: [], animes: [] })
  const reshuffle = (d: CatalogHome | null = data) => {
    if (!d) return
    setMix({ films: shuffled(d.films, Math.random, PER_ROW), series: shuffled(d.series, Math.random, PER_ROW), animes: shuffled(d.animes ?? [], Math.random, PER_ROW) })
  }
  const [hero, setHero] = useState<Title | null>(null)
  const [msg, setMsg] = useState('')
  const [recent, setRecent] = useState<Game[]>([])
  const [myList, setMyList] = useState<Title[]>([])
  const [news, setNews] = useState<EpisodeNews[]>([])
  // Prévia: parado num título, o trailer toca sem som no destaque
  const [previewOn, setPreviewOn] = useState(true)
  const [preview, setPreview] = useState<string | null>(null)
  const [sound, setSound] = useState(false)
  const soundRef = useRef(false)
  soundRef.current = sound
  const frame = useRef<HTMLIFrameElement | null>(null)
  const heroId = useRef<string | null>(null)
  heroId.current = hero?.id ?? null
  const send = (func: string) => frame.current?.contentWindow?.postMessage(playerCommand(func), YT_ORIGIN)

  useEffect(() => {
    if (!lazy) return
    Promise.all([lazy.catalog.home(), lazy.myList.get()]).then(([d, list]) => {
      setData(d); setMyList(list)
      reshuffle(d)
      setHero(list[0] ?? null)
      // Começa nos filmes e séries, para já ir passando e vendo as prévias
      window.setTimeout(() => {
        if (!document.querySelector('.lz-home :focus')) document.querySelector<HTMLElement>('.lz-home .lz-title')?.focus()
      }, 0)
    })
    lazy.games.recent().then(setRecent)
    lazy.catalog.episodes().then(setNews)
    lazy.settings.get().then((s) => { setPreviewOn(s.trailerPreview !== false); setSound(s.trailerSound === true) })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Trailers do título (melhor primeiro): se o YouTube disser que um não toca, vai para o próximo
  const trailers = useRef<{ key: string; lang: string; label?: string }[]>([])
  const [trailerLabel, setTrailerLabel] = useState('')
  const playTrailer = (i: number) => {
    const t = trailers.current[i]
    setPreview(t ? trailerEmbedUrl(t.key, { sound: soundRef.current, captions: t.lang !== 'pt' }) : null)
    setTrailerLabel(t?.label ? `Trailer ${t.label}` : '')
  }
  const trailerIndex = useRef(0)
  // Título cuja prévia foi pedida (1º aperto). Passar por outros títulos não cancela; só outro aperto troca.
  const [playingId, setPlayingId] = useState<string | null>(null)
  const previewRef = useRef<string | null>(null)
  previewRef.current = preview
  const playingRef = useRef<string | null>(null)
  playingRef.current = playingId
  useEffect(() => {
    setPreview(null)
    setTrailerLabel('')
    trailers.current = []
    if (!lazy || !hero || !previewOn || playingId !== hero.id) return
    const id = hero.id
    let alive = true
    lazy.catalog.trailer(id, { title: hero.title, year: hero.year }).then((list) => {
      if (!alive || heroId.current !== id) return
      trailers.current = list
      trailerIndex.current = 0
      playTrailer(0)
      if (!list.length) setMsg('Sem trailer para este título. Aperte de novo para assistir.')
    })
    return () => { alive = false }
  }, [playingId, previewOn]) // eslint-disable-line react-hooks/exhaustive-deps

  const rows = data ? buildRows({ ...mix, myList, news }) : []
  useEffect(() => { if (!hero && rows[0]?.items[0]) setHero(rows[0].items[0]) }, [rows.length]) // eslint-disable-line react-hooks/exhaustive-deps
  const rowsRef = useRef(rows)
  rowsRef.current = rows

  // "Parecido com este" (△ num título): fileira no topo com o mesmo clima, pela IA
  const similar = useSimilar(rowsRef, setMsg)

  // Trailer acabou: passa para o próximo título (o foco vai junto se estiver nas fileiras)
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      const ev = playerEvent(e.origin, e.data)
      if (ev === 'error') { trailerIndex.current += 1; playTrailer(trailerIndex.current); return }
      if (ev !== 'ended') return
      const nextId = nextTitleId(rowsRef.current, heroId.current)
      const next = rowsRef.current.flatMap((r) => r.items).find((t) => t.id === nextId)
      if (!next) return
      const card = document.querySelector<HTMLElement>(`.lz-title[data-id="${CSS.escape(next.id)}"]`)
      if (card && document.activeElement?.classList.contains('lz-title')) { card.focus(); card.scrollIntoView({ block: 'nearest', inline: 'nearest' }) }
      // A prévia foi pedida por você: ao acabar, segue tocando a do próximo título
      setHero(next)
      setPlayingId(next.id)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  // Som da prévia: liga/desliga na hora, sem recarregar, e fica salvo para as próximas
  const toggleSound = () => {
    const v = !sound
    setSound(v)
    lazy?.settings.set('trailerSound', v)
    send(v ? 'unMute' : 'mute')
  }
  const inList = !!hero && myList.some((x) => x.id === hero.id)
  const toggleList = async () => {
    if (!lazy || !hero) return
    const r = await lazy.myList.toggle(hero)
    if (!r.ok) { setMsg(r.msg ?? ''); return }
    setMyList(await lazy.myList.get())
  }
  const play = async (g: Game) => {
    const r = await lazy?.games.launch(g.id)
    if (r && !r.ok) setMsg(r.msg)
  }
  const info = hero ? heroInfo(hero) : null

  // Título salvo pela busca não tem serviço: pergunta ao TMDB onde ele está
  const watch = async (t: Title | null = hero) => {
    if (!lazy || !t) return
    const service = heroInfo(t).primary ?? (await lazy.catalog.where(t.id))[0]
    const url = service && urlOf(service)
    if (!url) { setMsg(`"${t.title}" não está nos seus serviços de streaming no Brasil.`); return }
    setMsg((await lazy.open(url, service)) || '')
  }
  // 1º aperto num título: prévia. 2º aperto no mesmo: abre onde assistir.
  const pressTitle = (t: Title) => {
    const r = previewStep({ playingId: playingRef.current }, { type: 'press', id: t.id, previewOn })
    setPlayingId(r.state.playingId)
    if (r.open) { void watch(t); return }
    setHero(t)
    setMsg('')
  }
  // Botão "Assistir" do destaque: abre e para a prévia
  const watchHero = () => {
    setPlayingId(previewStep({ playingId: playingRef.current }, { type: 'watch' }).state.playingId)
    void watch()
  }
  // Laaazy saiu da frente (Edge, jogo, Área de trabalho): a prévia para
  useEffect(() => {
    const leave = () => setPlayingId(previewStep({ playingId: playingRef.current }, { type: 'leave' }).state.playingId)
    const onVisibility = () => { if (document.hidden) leave() }
    window.addEventListener('blur', leave)
    document.addEventListener('visibilitychange', onVisibility)
    return () => { window.removeEventListener('blur', leave); document.removeEventListener('visibilitychange', onVisibility) }
  }, [])
  const focusTitle = (t: Title) => {
    sounds.hover()
    // Só trava o destaque enquanto a prévia está tocando de verdade (título sem trailer não trava)
    if (titleFocus(previewRef.current ? playingRef.current : null, t.id) === 'keep') return
    if (playingRef.current !== t.id) setPlayingId(null)
    setHero(t)
    setMsg('')
  }
  const tap = (fn: () => void) => () => { sounds.click(); fn() }
  // Controle vira mouse e o Laaazy sai da frente; o PS traz de volta
  const desktop = async () => {
    const r = await lazy?.desktop()
    if (r && !r.ok) setMsg(r.msg)
  }

  return (
    <section className="lz-home" aria-label="Início">
      {hero && info && (
        <div className="lz-hero">
          <div>
            <div className="lz-meta">{info.meta}</div>
            <h1>{hero.title}</h1>
            {hero.overview && <p className="lz-overview">{hero.overview}</p>}
            <div className="lz-actions">
              <button type="button" className="lz-btn primary" onClick={tap(watchHero)} onMouseEnter={sounds.hover}>▶ {info.primary ? `Assistir na ${info.primary}` : 'Onde assistir'}</button>
              {previewOn && <button type="button" className="lz-btn" aria-pressed={sound} onClick={tap(toggleSound)} onMouseEnter={sounds.hover}>{sound ? '🔊 Trailer com som' : '🔇 Trailer sem som'}</button>}
              <button type="button" className="lz-btn" aria-pressed={inList} onClick={tap(toggleList)} onMouseEnter={sounds.hover}>{inList ? '✓ Na Minha lista' : '＋ Minha lista'}</button>
              <button type="button" className="lz-btn" onClick={tap(() => reshuffle())} onMouseEnter={sounds.hover}>↻ Outros títulos</button>
            </div>
            {msg && <p className="lz-meta" role="status">{msg}</p>}
          </div>
          <div className="lz-hero-media" style={bg(hero)} aria-hidden="true">
            {preview && trailerLabel && <span className="lz-trailer-label">🇧🇷 {trailerLabel}</span>}
            {preview && <iframe key={preview} ref={frame} src={preview} title="Prévia do trailer" tabIndex={-1} allow="autoplay; encrypted-media" onLoad={() => send('listening')} />}
          </div>
        </div>
      )}

      {data && !data.configured && (
        <div className="lz-empty">
          Para ver filmes e séries em alta nos seus apps, configure a chave do TMDB.{' '}
          <button type="button" className="lz-btn" onClick={tap(onOpenSettings)}>Abrir Configurações</button>
        </div>
      )}
      {data && data.configured && data.msg && <div className="lz-empty" role="status">{data.msg}</div>}

      {similar && (
        <div className="lz-row lz-similar">
          <h2>
            {similar.loading ? `Procurando títulos com o clima de ${similar.source.title}...` : `Parecido com ${similar.source.title}`}
            {similar.mood && <small> · {similar.mood}</small>}
          </h2>
          <div className="lz-strip">
            {similar.items.map((t) => (
              <button key={t.id} type="button" className="lz-title" data-id={t.id} style={bg(t)} aria-label={`${t.title} (${t.kind})`}
                onFocus={() => focusTitle(t)} onClick={tap(() => pressTitle(t))}>
                <span>{t.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {rows.map((row) => (
        <div key={row.id} className="lz-row">
          <h2>{row.title}</h2>
          <div className="lz-strip">
            {row.items.map((t) => (
              <button key={t.id} type="button" className="lz-title" data-id={t.id} style={bg(t)} aria-label={`${t.title} (${t.kind})`}
                onFocus={() => focusTitle(t)} onClick={tap(() => pressTitle(t))}>
                {row.badges?.[t.id] && <em className="lz-badge">{row.badges[t.id]}</em>}
                <span>{t.title}</span>
              </button>
            ))}
          </div>
        </div>
      ))}

      {recent.length > 0 && (
        <div className="lz-row">
          <h2>Continuar jogando</h2>
          <div className="lz-strip">
            {recent.map((g) => (
              <button key={g.id} type="button" className="lz-title" style={g.cover ? { backgroundImage: `url(${g.cover})` } : undefined}
                onClick={tap(() => play(g))} onFocus={sounds.hover}><span>{g.name}</span></button>
            ))}
          </div>
        </div>
      )}

      <div className="lz-row">
        <h2>Seus apps</h2>
        <div className="lz-strip">
          {pinnedCards(CATALOG, pinned).map((card) => (
            <button key={card.label} type="button" className="lz-app" style={{ background: card.bg ?? 'rgba(255,255,255,.14)', color: card.fg ?? '#fff' }}
              aria-label={card.label} onClick={() => { sounds.click(); onActivate(card) }} onFocus={sounds.hover}>
              <AppIcon card={card} size={36} /><span>{card.label}</span>
            </button>
          ))}
          <button type="button" className="lz-app" style={{ background: 'rgba(255,255,255,.14)', color: '#fff' }}
            aria-label="Área de trabalho" onClick={tap(desktop)} onFocus={sounds.hover}>
            <span aria-hidden="true" style={{ fontSize: 30 }}>🖥</span><span>Área de trabalho</span>
          </button>
        </div>
      </div>
    </section>
  )
}
