'use client'

import { useEffect, useReducer, useRef } from 'react'
import gamepad from '../shared/gamepad'
import PS4Background from './components/PS4Background'
import Header from './components/Header'
import Footer from './components/Footer'
import HomeScreen from './screens/HomeScreen'
import LibraryScreen from './screens/LibraryScreen'
import Ds4Screen from './screens/Ds4Screen'
import SettingsScreen from './screens/SettingsScreen'
import { useGamepad } from './hooks/useGamepad'
import { useSounds } from './hooks/useSounds'
import { CATALOG, type Card } from './lib/catalog'
import { focusMove } from './lib/focus'
import { nextZone } from './lib/home-zone'
import { getLazy } from './lib/lazy-api'
import { initialScreen, screenReducer } from './lib/screen-state'

const { BTN } = gamepad
const REPEAT_MS = 220
const ANIM_MS = { entering: 420, leaving: 620 }
const SCREEN_FOCUSABLE = '.library-view button, .library-view input, .ds4-view button, .ds4-view input'
const HEADER_BUTTONS = '.ps4-icons button'

const focusFirst = (selector: string) => document.querySelector<HTMLElement>(selector)?.focus()

// No menu: ←→ anda na fileira atual; ↑↓ troca entre cards e cabeçalho
function homeNav(dx: number, dy: number, move: (dir: number) => void) {
  const inHeader = !!document.querySelector('.ps4-header :focus')
  if (dy) {
    const zone = nextZone(inHeader ? 'header' : 'tiles', dy)
    if (zone === 'header' && !inHeader) focusFirst(HEADER_BUTTONS)
    if (zone === 'tiles' && inHeader) focusFirst('.ps4-tile.is-selected')
  } else if (dx) {
    if (inHeader) focusMove(HEADER_BUTTONS, dx, 0)
    else move(dx)
  }
}

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

  // Avisos de arquivos de configuração corrompidos ou que não salvaram
  useEffect(() => {
    getLazy()?.store.warnings().then((ws) => { if (ws.length) window.alert(ws.map((w) => w.msg).join('\n\n')) })
  }, [])

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
    const { screen } = stateRef.current
    const home = screen === 'home'
    const now = performance.now()
    if ((dx || dy) && now - lastMove.current > REPEAT_MS) {
      if (!home) focusMove(SCREEN_FOCUSABLE, dx, dx ? 0 : dy)
      else homeNav(dx, dy, (dir) => dispatch({ type: 'move', dir, count: CATALOG.length }))
      lastMove.current = now
    }
    if (!dx && !dy) lastMove.current = 0
    if (fired(BTN.X)) (document.activeElement as HTMLElement | null)?.click()
    if (fired(BTN.O) && !home) document.querySelector<HTMLElement>('.library-back')?.click()
    if (fired(BTN.SQUARE) && screen === 'library') focusFirst('.library-search input')
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
      <Header
        sounds={sounds}
        onController={() => dispatch({ type: 'open', screen: 'ds4' })}
        onSettings={() => dispatch({ type: 'open', screen: 'settings' })}
        onPower={() => getLazy()?.quit()}
      />
      {state.screen === 'library' && <LibraryScreen onBack={back} sounds={sounds} />}
      {state.screen === 'ds4' && <Ds4Screen onBack={back} sounds={sounds} />}
      {state.screen === 'settings' && <SettingsScreen onBack={back} sounds={sounds} />}
      {state.screen === 'home' && (
        <HomeScreen selected={state.selected} active sounds={sounds} onSelect={(i) => dispatch({ type: 'select', index: i })} onActivate={activate} />
      )}
      <Footer screen={state.screen} />
    </main>
  )
}
