'use client'

import { useEffect, useReducer, useRef } from 'react'
import gamepad from '../shared/gamepad'
import PS4Background from './components/PS4Background'
import Header from './components/Header'
import Footer from './components/Footer'
import HomeScreen from './screens/HomeScreen'
import LibraryScreen from './screens/LibraryScreen'
import Ds4Screen from './screens/Ds4Screen'
import { useGamepad } from './hooks/useGamepad'
import { useSounds } from './hooks/useSounds'
import { CATALOG, type Card } from './lib/catalog'
import { focusMove } from './lib/focus'
import { getLazy } from './lib/lazy-api'
import { initialScreen, screenReducer } from './lib/screen-state'

const { BTN } = gamepad
const REPEAT_MS = 220
const ANIM_MS = { entering: 420, leaving: 620 }
const SCREEN_FOCUSABLE = '.library-view button, .library-view input, .ds4-view button'

export default function Page() {
  const [state, dispatch] = useReducer(screenReducer, initialScreen)
  const stateRef = useRef(state)
  stateRef.current = state
  const sounds = useSounds()
  const lastMove = useRef(0)

  // Animação da Biblioteca: termina sozinha depois do tempo da transição CSS
  useEffect(() => {
    if (state.anim === 'none') return
    const t = window.setTimeout(() => dispatch({ type: 'animDone' }), ANIM_MS[state.anim])
    return () => window.clearTimeout(t)
  }, [state.anim])

  // Botão PS / atalho global: o Electron manda voltar ao menu
  useEffect(() => { getLazy()?.onHome(() => dispatch({ type: 'goHome' })) }, [])

  // Setas do teclado (o reducer ignora fora do menu)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') dispatch({ type: 'move', dir: -1, count: CATALOG.length })
      if (e.key === 'ArrowRight') dispatch({ type: 'move', dir: 1, count: CATALOG.length })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // A fileira de cards não pode rolar para o lado sozinha
  useEffect(() => {
    const el = document.querySelector<HTMLElement>('.ps4-screen')
    if (!el) return
    const fix = () => { if (el.scrollLeft !== 0) el.scrollLeft = 0 }
    el.addEventListener('scroll', fix)
    return () => el.removeEventListener('scroll', fix)
  }, [])

  const padOn = useGamepad(({ fired, dx, dy }) => {
    const home = stateRef.current.screen === 'home'
    const now = performance.now()
    if ((dx || dy) && now - lastMove.current > REPEAT_MS) {
      if (!home) focusMove(SCREEN_FOCUSABLE, dx, dx ? 0 : dy)
      else if (dx) dispatch({ type: 'move', dir: dx, count: CATALOG.length })
      lastMove.current = now
    }
    if (!dx && !dy) lastMove.current = 0
    if (fired(BTN.X)) (document.activeElement as HTMLElement | null)?.click()
    if (fired(BTN.O) && !home) document.querySelector<HTMLElement>('.library-back')?.click()
  })

  const activate = (card: Card) => {
    const lazy = getLazy()
    if (card.screen) return dispatch({ type: 'open', screen: card.screen })
    if (card.app) return void lazy?.launch(card.app).then((r) => { if (r) window.alert(r) })
    if (!card.url) return
    if (!lazy) { window.location.href = card.url; return }
    lazy.open(card.url, card.label).then((r) => { if (r) window.alert(r) })
  }

  const back = () => { sounds.click(); dispatch({ type: 'leave' }) }

  return (
    <main className={`ps4-screen ${state.anim === 'entering' ? 'library-entering' : ''} ${state.anim === 'leaving' ? 'library-leaving' : ''}`}>
      <PS4Background />
      <div className="pad-badge">{padOn ? 'Controle conectado' : 'Controle não detectado. Aperte um botão.'}</div>
      <Header sounds={sounds} />
      {state.screen === 'library' && <LibraryScreen onBack={back} sounds={sounds} />}
      {state.screen === 'ds4' && <Ds4Screen onBack={back} sounds={sounds} />}
      {state.screen === 'home' && (
        <HomeScreen selected={state.selected} active sounds={sounds} onSelect={(i) => dispatch({ type: 'select', index: i })} onActivate={activate} />
      )}
      <Footer library={state.screen === 'library'} />
    </main>
  )
}
