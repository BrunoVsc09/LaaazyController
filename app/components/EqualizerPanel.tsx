'use client'

// Configurações → Som: equalizador do Windows pelo Equalizer APO (regras em app/lib/equalizer).
// X numa banda (ou no Bass Boost/Clarity) entra no ajuste: ↑/↓ (ou ←/→) mudam; X ou O terminam.
import { useEffect, useRef, useState } from 'react'
import gamepad from '../../shared/gamepad'
import { useGamepad } from '../hooks/useGamepad'
import { BANDS, FLAT, INSTALL_WAIT, applyPreset, curvePoints, dbText, nextPreset, presetLabel, statusText, stepBand, stepEffect } from '../lib/equalizer'
import { holdStep, type Hold } from '../lib/nav-repeat'
import { getLazy, type EqState, type EqStatus } from '../lib/lazy-api'
import type { Sounds } from '../hooks/useSounds'

type Props = { sounds: Sounds; onMsg: (msg: string) => void }
type Target = number | 'bass' | 'clarity' // número = banda
const W = 900
const H = 180
const NO_HOLD: Hold = { dir: '', steps: 0, at: 0 }
const EFFECTS = [{ key: 'bass', label: 'Bass Boost' }, { key: 'clarity', label: 'Clarity' }] as const
const hz = (fc: number) => (fc >= 1000 ? `${fc / 1000} kHz` : `${fc} Hz`)

export default function EqualizerPanel({ sounds, onMsg }: Props) {
  const lazy = getLazy()
  const [status, setStatus] = useState<EqStatus | null>(null)
  const [state, setState] = useState<EqState>(FLAT)
  const [editing, setEditing] = useState<Target | null>(null)
  const [installing, setInstalling] = useState(false)
  const hold = useRef<Hold>(NO_HOLD)

  useEffect(() => {
    lazy?.eq.status().then((s) => { setStatus(s); setState(s.state) })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Depois de mexer, confere se a gravação no APO deu certo (o serviço grava 150 ms depois)
  useEffect(() => {
    if (!status) return
    const t = window.setTimeout(() => lazy?.eq.status().then(setStatus), 500)
    return () => window.clearTimeout(t)
  }, [state]) // eslint-disable-line react-hooks/exhaustive-deps

  const save = (next: EqState) => {
    if (next === state) return
    setState(next)
    lazy?.eq.set(next)
  }
  const step = (t: Target, dir: 1 | -1) => save(typeof t === 'number' ? stepBand(state, t, dir) : stepEffect(state, t, dir))

  useGamepad(({ fired, dx, dy }) => {
    if (editing === null) return
    if (fired(gamepad.BTN.X) || fired(gamepad.BTN.O)) { sounds.click(); hold.current = NO_HOLD; setEditing(null); return }
    const dir = typeof editing === 'number' ? -dy : dx // ↑ sobe o ganho; → aumenta o efeito
    const r = holdStep(hold.current, dir ? String(dir) : '', performance.now())
    hold.current = r.hold
    if (r.step) step(editing, dir as 1 | -1)
  })

  const tap = (fn: () => void) => () => { sounds.click(); fn() }
  const edit = (t: Target) => tap(() => setEditing(editing === t ? null : t))
  const toggle = () => {
    save({ ...state, on: !state.on })
    onMsg(state.on ? 'Equalizador desligado: o som volta ao original.' : 'Equalizador ligado.')
  }
  const cyclePreset = () => {
    const next = applyPreset(state, nextPreset(state.preset))
    save(next)
    onMsg(`Preset: ${presetLabel(next.preset)}.`)
  }

  // Baixa e instala o APO; o "Sim" do Windows e a escolha da saída de som ficam com o mouse
  const install = async () => {
    if (!lazy || installing) return
    setInstalling(true)
    onMsg(INSTALL_WAIT)
    const r = await lazy.eq.install()
    setInstalling(false)
    onMsg(r.msg)
    setStatus(await lazy.eq.status())
  }

  const note = status ? statusText(status) : 'Procurando o Equalizer APO...'
  const pts = curvePoints(state.bands, W, H)
  const line = pts.map((p) => `${p.x},${p.y}`).join(' ')
  const help = editing === null ? 'X numa banda, no Bass Boost ou no Clarity para ajustar.'
    : typeof editing === 'number' ? '↑/↓ mudam o ganho · X ou O terminam' : '←/→ mudam a força · X ou O terminam'

  return (
    <div className={`eq ${state.on ? '' : 'off'}`}>
      {note && <p className="ds4-help eq-note" role="status">{note}</p>}
      {status && !status.installed && (
        <button className="ds4-row" onClick={tap(install)} onMouseEnter={sounds.hover} aria-busy={installing}>
          <span>Instalar o Equalizer APO</span><b>{installing ? 'Instalando...' : '▶'}</b>
        </button>
      )}
      <button className="ds4-row" onClick={tap(toggle)} onMouseEnter={sounds.hover}><span>Equalizador</span><b>{state.on ? 'Ligado' : 'Desligado'}</b></button>
      <button className="ds4-row" onClick={tap(cyclePreset)} onMouseEnter={sounds.hover}><span>Preset</span><b>{presetLabel(state.preset)}</b></button>
      <div className="eq-body">
        <div className="eq-effects">
          {EFFECTS.map(({ key, label }) => (
            <button key={key} type="button" className={`eq-effect ${editing === key ? 'editing' : ''}`} onClick={edit(key)} onMouseEnter={sounds.hover}
              onWheel={(e) => step(key, e.deltaY < 0 ? 1 : -1)}>
              <span>{label}</span>
              <span className="eq-meter"><i style={{ width: `${state[key] * 10}%` }} /></span>
              <b>{state[key]}</b>
            </button>
          ))}
        </div>
        <div className="eq-graph">
          <div className="eq-plot">
            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden>
              <line x1="0" x2={W} y1={H / 2} y2={H / 2} className="eq-zero" />
              {pts.map((p) => <line key={p.x} x1={p.x} x2={p.x} y1="0" y2={H} className="eq-grid" />)}
              <polygon points={`${pts[0].x},${H} ${line} ${pts[pts.length - 1].x},${H}`} className="eq-fill" />
              <polyline points={line} className="eq-line" />
            </svg>
            {pts.map((p, i) => (
              <span key={p.x} className={`eq-dot ${editing === i ? 'editing' : ''}`} style={{ left: `${(p.x / W) * 100}%`, top: `${(p.y / H) * 100}%` }}>
                <em>{dbText(state.bands[i])}</em>
              </span>
            ))}
          </div>
          <div className="eq-bands">
            {BANDS.map((fc, i) => (
              <button key={fc} type="button" className={`eq-band ${editing === i ? 'editing' : ''}`} onClick={edit(i)} onMouseEnter={sounds.hover}
                onWheel={(e) => step(i, e.deltaY < 0 ? 1 : -1)} aria-label={`${hz(fc)}: ${dbText(state.bands[i])} dB`}>
                {hz(fc)}
              </button>
            ))}
          </div>
        </div>
      </div>
      <p className="ds4-help">{help}</p>
      {editing !== null && <span data-pad-capture hidden />}
    </div>
  )
}
