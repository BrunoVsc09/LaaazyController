'use client'

import { useEffect, useReducer, useRef, useState } from 'react'
import gamepad from '../shared/gamepad'
import PS4Background from './components/PS4Background'
import Header from './components/Header'
import Tabs from './components/Tabs'
import Footer from './components/Footer'
import OnScreenKeyboard from './components/OnScreenKeyboard'
import PowerMenu from './components/PowerMenu'
import Screensaver from './components/Screensaver'
import HomeScreen from './screens/HomeScreen'
import LibraryScreen from './screens/LibraryScreen'
import AppsScreen from './screens/AppsScreen'
import Ds4Screen from './screens/Ds4Screen'
import SettingsScreen from './screens/SettingsScreen'
import SearchScreen from './screens/SearchScreen'
import { useGamepad } from './hooks/useGamepad'
import { useSounds } from './hooks/useSounds'
import type { Card } from './lib/catalog'
import { focusMove, hoverTarget, keepsFocusOnPress } from './lib/focus'
import { DEFAULT_PINNED, togglePin } from './lib/home-model'
import { getLazy } from './lib/lazy-api'
import { OSK_HINTS } from './lib/osk'
import { createIdle } from './lib/screensaver'
import { initialScreen, screenReducer, type Screen } from './lib/screen-state'

const { BTN } = gamepad
const REPEAT_MS = 220
const ANIM_MS = { entering: 420, leaving: 620 }
// Tudo o que dá para focar na tela; o controle anda até o mais próximo na direção
const FOCUSABLE = '.ps4-screen button:not(:disabled), .ps4-screen input'
// Onde o foco pode ir agora: teclado na tela, menu de energia, janelinha da tela ou a tela toda
const navSelector = (osk: boolean, modal: boolean, inner: boolean) =>
  osk ? '.osk button' : modal ? '.power-menu button' : inner ? '[data-modal] button' : FOCUSABLE

const focusFirst = (selector: string) => document.querySelector<HTMLElement>(selector)?.focus()

export default function Page() {
  const [state, dispatch] = useReducer(screenReducer, initialScreen)
  const stateRef = useRef(state)
  stateRef.current = state
  const sounds = useSounds()
  const lastMove = useRef(0)
  const [pinned, setPinned] = useState<string[]>(DEFAULT_PINNED)
  // Teclado na tela: aberto para um campo de texto (X do controle num campo)
  const [oskTarget, setOskTarget] = useState<HTMLInputElement | null>(null)
  const oskRef = useRef<HTMLInputElement | null>(null)
  oskRef.current = oskTarget
  const oskPress = useRef<((key: string) => void) | null>(null)
  const [powerOpen, setPowerOpen] = useState(false)
  // Proteção de tela: liga depois de N minutos parado; qualquer botão desliga (e esse aperto é ignorado)
  const idle = useRef(createIdle())
  const [saver, setSaver] = useState(false)
  const saverRef = useRef(false)
  saverRef.current = saver
  const [saverMinutes, setSaverMinutes] = useState(10)
  const wake = () => { idle.current.touch(); setSaver(false) }
  const powerRef = useRef(false)
  powerRef.current = powerOpen
  const closePower = () => { setPowerOpen(false); focusFirst('.ps4-icons button') }
  const closeOsk = () => { const t = oskRef.current; setOskTarget(null); t?.focus() }

  useEffect(() => { getLazy()?.settings.get().then((s) => { if (s.pinnedApps) setPinned(s.pinnedApps) }) }, [])
  // Relê o tempo da proteção de tela ao sair das Configurações
  useEffect(() => { getLazy()?.settings.get().then((s) => setSaverMinutes(s.screensaverMinutes ?? 10)) }, [state.screen])
  useEffect(() => {
    const t = window.setInterval(() => {
      if (!oskRef.current && !powerRef.current && idle.current.isIdle(saverMinutes)) setSaver(true)
    }, 5000)
    return () => window.clearInterval(t)
  }, [saverMinutes])
  useEffect(() => {
    const onActivity = (e: Event) => { if (saverRef.current) { e.preventDefault(); e.stopPropagation(); wake() } else idle.current.touch() }
    const evs = ['keydown', 'mousedown', 'mousemove', 'wheel']
    for (const ev of evs) window.addEventListener(ev, onActivity, true)
    return () => { for (const ev of evs) window.removeEventListener(ev, onActivity, true) }
  }, [])
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
    if (state.screen !== 'library') window.setTimeout(() => { if (!document.querySelector('.lz-search')) focusFirst('.lz-home button, .lz-apps button, .ds4-view button') }, 0)
  }, [state.screen])

  // Botão PS / atalho global: o Electron manda voltar ao Início
  useEffect(() => { getLazy()?.onHome(() => { wake(); dispatch({ type: 'goHome' }) }) }, []) // eslint-disable-line react-hooks/exhaustive-deps

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

  // Cursor do analógico: a borda de seleção acompanha o cursor e clicar no fundo não a apaga
  useEffect(() => {
    const onOver = (e: MouseEvent) => {
      const sel = navSelector(!!oskRef.current, powerRef.current, !!document.querySelector('[data-modal]'))
      const el = hoverTarget(e.target as HTMLElement, document.activeElement as HTMLElement | null, sel) as HTMLElement | null
      el?.focus({ preventScroll: true })
    }
    const onDown = (e: MouseEvent) => { if (keepsFocusOnPress(e.target as HTMLElement)) e.preventDefault() }
    window.addEventListener('mouseover', onOver)
    window.addEventListener('mousedown', onDown)
    return () => { window.removeEventListener('mouseover', onOver); window.removeEventListener('mousedown', onDown) }
  }, [])

  const go = (screen: Screen) => dispatch(screen === 'home' ? { type: 'goHome' } : { type: 'open', screen })
  const back = () => { sounds.click(); dispatch({ type: 'leave' }) }

  const padOn = useGamepad(({ fired, dx, dy, active: touched }) => {
    if (touched) {
      if (saverRef.current) { wake(); return }
      idle.current.touch()
    }
    if (saverRef.current) return
    const { screen } = stateRef.current
    const osk = !!oskRef.current
    const modal = powerRef.current
    // Janelinhas dentro das telas (ex.: escolher perfil do jogo) marcadas com data-modal
    const inner = !!document.querySelector('[data-modal]')
    const now = performance.now()
    if ((dx || dy) && now - lastMove.current > REPEAT_MS) {
      focusMove(navSelector(osk, modal, inner), dx, dx ? 0 : dy)
      lastMove.current = now
    }
    if (!dx && !dy) lastMove.current = 0
    if (osk) {
      if (fired(BTN.X)) (document.activeElement as HTMLElement | null)?.click()
      if (fired(BTN.SQUARE)) oskPress.current?.('backspace')
      if (fired(BTN.TRIANGLE)) oskPress.current?.('space')
      if (fired(BTN.O)) closeOsk()
      return
    }
    if (inner && !modal) {
      if (fired(BTN.X)) (document.activeElement as HTMLElement | null)?.click()
      if (fired(BTN.O)) window.dispatchEvent(new Event('lz:close-modal'))
      return
    }
    if (modal) {
      if (fired(BTN.X)) (document.activeElement as HTMLElement | null)?.click()
      if (fired(BTN.O)) closePower()
      return
    }
    if (fired(BTN.L2)) getLazy()?.volume('down')
    if (fired(BTN.R2)) getLazy()?.volume('up')
    const active = document.activeElement
    if (fired(BTN.X)) {
      if (active instanceof HTMLInputElement) setOskTarget(active)
      else (active as HTMLElement | null)?.click()
    }
    if (fired(BTN.O) && screen !== 'home') back()
    if (fired(BTN.TRIANGLE) && (screen === 'library' || screen === 'home')) window.dispatchEvent(new Event('lz:triangle'))
    if (fired(BTN.SQUARE)) {
      if (screen === 'library') focusFirst('.library-search input')
      else if (screen === 'home' || screen === 'apps') go('search')
    }
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
      <Header sounds={sounds} onController={() => go('ds4')} onSettings={() => go('settings')} onPower={() => setPowerOpen(true)} />
      {['home', 'library', 'apps'].includes(state.screen) && <Tabs current={state.screen} onGo={go} sounds={sounds} />}
      {state.screen === 'home' && <HomeScreen pinned={pinned} sounds={sounds} onActivate={activate} onOpenSettings={() => go('settings')} />}
      {state.screen === 'library' && <LibraryScreen onBack={back} sounds={sounds} />}
      {state.screen === 'apps' && <AppsScreen pinned={pinned} sounds={sounds} onActivate={activate} onTogglePin={onTogglePin} />}
      {state.screen === 'ds4' && <Ds4Screen onBack={back} sounds={sounds} />}
      {state.screen === 'settings' && <SettingsScreen onBack={back} sounds={sounds} />}
      {state.screen === 'search' && <SearchScreen sounds={sounds} onActivate={activate} onBack={back} />}
      {saver && <Screensaver />}
      {powerOpen && <PowerMenu onClose={closePower} sounds={sounds} />}
      {oskTarget && <OnScreenKeyboard target={oskTarget} onClose={closeOsk} sounds={sounds} pressRef={oskPress} />}
      <Footer screen={state.screen} hints={oskTarget ? OSK_HINTS : undefined} />
    </main>
  )
}
