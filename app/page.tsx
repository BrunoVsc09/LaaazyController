'use client'

import { useEffect, useReducer, useRef, useState } from 'react'
import gamepad from '../shared/gamepad'
import PS4Background from './components/PS4Background'
import Header from './components/Header'
import Tabs from './components/Tabs'
import Footer from './components/Footer'
import HomeScreen from './screens/HomeScreen'
import LibraryScreen from './screens/LibraryScreen'
import AppsScreen from './screens/AppsScreen'
import Ds4Screen from './screens/Ds4Screen'
import SettingsScreen from './screens/SettingsScreen'
import { useGamepad } from './hooks/useGamepad'
import { useSounds } from './hooks/useSounds'
import type { Card } from './lib/catalog'
import { focusMove } from './lib/focus'
import { DEFAULT_PINNED, togglePin } from './lib/home-model'
import { getLazy } from './lib/lazy-api'
import { initialScreen, screenReducer, type Screen } from './lib/screen-state'

const { BTN } = gamepad
const REPEAT_MS = 220
const ANIM_MS = { entering: 420, leaving: 620 }
// Tudo o que dá para focar na tela; o controle anda até o mais próximo na direção
const FOCUSABLE = '.ps4-screen button:not(:disabled), .ps4-screen input'

const focusFirst = (selector: string) => document.querySelector<HTMLElement>(selector)?.focus()

export default function Page() {
  const [state, dispatch] = useReducer(screenReducer, initialScreen)
  const stateRef = useRef(state)
  stateRef.current = state
  const sounds = useSounds()
  const lastMove = useRef(0)
  const [pinned, setPinned] = useState<string[]>(DEFAULT_PINNED)

  useEffect(() => { getLazy()?.settings.get().then((s) => { if (s.pinnedApps) setPinned(s.pinnedApps) }) }, [])
  const onTogglePin = (label: string) => {
    const next = togglePin(pinned, label)
    setPinned(next)
    getLazy()?.settings.set('pinnedApps', next)
  }

  // Animação da Biblioteca: termina sozinha depois do tempo da transição CSS
  useEffect(() => {
    if (state.anim === 'none') return
    const t = window.setTimeout(() => dispatch({ type: 'animDone' }), ANIM_MS[state.anim])
    return () => window.clearTimeout(t)
  }, [state.anim])

  // Ao trocar de tela, o foco vai para o primeiro item dela (a Biblioteca cuida do seu)
  useEffect(() => {
    if (state.screen !== 'library') window.setTimeout(() => focusFirst('.lz-home button, .lz-apps button, .ds4-view button'), 0)
  }, [state.screen])

  // Botão PS / atalho global: o Electron manda voltar ao Início
  useEffect(() => { getLazy()?.onHome(() => dispatch({ type: 'goHome' })) }, [])

  // Avisos de arquivos de configuração corrompidos ou que não salvaram
  useEffect(() => {
    getLazy()?.store.warnings().then((ws) => { if (ws.length) window.alert(ws.map((w) => w.msg).join('\n\n')) })
  }, [])

  // Setas do teclado fazem o mesmo que o D-pad
  useEffect(() => {
    const DIRS: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }
    const onKey = (e: KeyboardEvent) => {
      const d = DIRS[e.key]
      if (!d || (e.target as HTMLElement)?.tagName === 'INPUT') return
      e.preventDefault()
      focusMove(FOCUSABLE, d[0], d[1])
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const go = (screen: Screen) => dispatch(screen === 'home' ? { type: 'goHome' } : { type: 'open', screen })
  const back = () => { sounds.click(); dispatch({ type: 'leave' }) }

  const padOn = useGamepad(({ fired, dx, dy }) => {
    const { screen } = stateRef.current
    const now = performance.now()
    if ((dx || dy) && now - lastMove.current > REPEAT_MS) {
      focusMove(FOCUSABLE, dx, dx ? 0 : dy)
      lastMove.current = now
    }
    if (!dx && !dy) lastMove.current = 0
    if (fired(BTN.X)) (document.activeElement as HTMLElement | null)?.click()
    if (fired(BTN.O) && screen !== 'home') back()
    if (fired(BTN.SQUARE) && screen === 'library') focusFirst('.library-search input')
  })

  const activate = (card: Card) => {
    const lazy = getLazy()
    if (card.screen) return go(card.screen)
    if (card.app) return void lazy?.launch(card.app).then((r) => { if (r) window.alert(r) })
    if (!card.url) return
    if (!lazy) { window.location.href = card.url; return }
    lazy.open(card.url, card.label).then((r) => { if (r) window.alert(r) })
  }

  return (
    <main className={`ps4-screen ${state.anim === 'entering' ? 'library-entering' : ''} ${state.anim === 'leaving' ? 'library-leaving' : ''}`}>
      <PS4Background />
      <div className="pad-badge">{padOn ? 'Controle conectado' : 'Controle não detectado. Aperte um botão.'}</div>
      <Header sounds={sounds} onController={() => go('ds4')} onSettings={() => go('settings')} onPower={() => getLazy()?.quit()} />
      {['home', 'library', 'apps'].includes(state.screen) && <Tabs current={state.screen} onGo={go} sounds={sounds} />}
      {state.screen === 'home' && <HomeScreen pinned={pinned} sounds={sounds} onActivate={activate} onOpenSettings={() => go('settings')} />}
      {state.screen === 'library' && <LibraryScreen onBack={back} sounds={sounds} />}
      {state.screen === 'apps' && <AppsScreen pinned={pinned} sounds={sounds} onActivate={activate} onTogglePin={onTogglePin} />}
      {state.screen === 'ds4' && <Ds4Screen onBack={back} sounds={sounds} />}
      {state.screen === 'settings' && <SettingsScreen onBack={back} sounds={sounds} />}
      <Footer screen={state.screen} />
    </main>
  )
}
