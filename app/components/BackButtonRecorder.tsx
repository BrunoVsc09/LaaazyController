'use client'

// "Gravar botão de voltar": para controle sem PS que funcione (ex.: 8BitDo). Aperta aqui, aperta no
// controle L3, R3 ou Start, e esse botão passa a voltar ao Laaazy nos perfis (como o PS).
import { useEffect, useState } from 'react'
import { useGamepad } from '../hooks/useGamepad'
import { backButtonOf, backChanges, backChoiceError, padButtonAt } from '../lib/pad-editor'
import { getLazy, type PadProfile } from '../lib/lazy-api'
import type { Sounds } from '../hooks/useSounds'

type Props = { profiles: string[]; sounds: Sounds; onMsg: (msg: string) => void; onSaved: () => void }
const CAPTURE_MS = 10000
const LABEL: Record<string, string> = { L3: 'L3', R3: 'R3', Options: 'Start' }

export default function BackButtonRecorder({ profiles, sounds, onMsg, onSaved }: Props) {
  const lazy = getLazy()
  const [capture, setCapture] = useState(false)
  const [current, setCurrent] = useState<string | null>(null)

  const load = async (): Promise<PadProfile[]> => {
    const all = await Promise.all(profiles.map((n) => lazy?.ds4.profile(n)))
    return all.flatMap((r) => (r?.ok && r.profile ? [r.profile] : []))
  }
  useEffect(() => { load().then((ps) => setCurrent(backButtonOf(ps))) }, [profiles.join('|')]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!capture) return
    const t = window.setTimeout(() => { setCapture(false); onMsg('Não chegou nenhum botão. Tente de novo.') }, CAPTURE_MS)
    return () => window.clearTimeout(t)
  }, [capture]) // eslint-disable-line react-hooks/exhaustive-deps

  const record = async (id: string) => {
    const err = backChoiceError(id)
    if (err) return onMsg(err)
    setCapture(false)
    sounds.click()
    for (const c of backChanges(await load(), id)) {
      const r = await lazy!.ds4.setButton(c.profile, c.id, c.action)
      if (!r.ok) return onMsg(r.msg ?? 'Não consegui salvar o perfil.')
    }
    setCurrent(id)
    onSaved()
    onMsg(`Pronto: ${LABEL[id]} agora volta ao Laaazy, como o PS. Teste em "Testar o PS" apertando ${LABEL[id]}.`)
  }
  // Escutando o controle: o primeiro botão apertado (o editor da tela fica parado, data-pad-capture)
  useGamepad(({ fired }) => {
    if (!capture) return
    for (let i = 0; i <= 17; i++) {
      const id = fired(i) ? padButtonAt(i) : null
      if (id) { void record(id); return }
    }
  })

  const start = () => {
    sounds.click()
    setCapture((c) => !c)
    onMsg(capture ? '' : 'Aperte no controle o botão que vai voltar ao Laaazy: L3, R3 (apertar um analógico) ou Start...')
  }
  return (
    <>
      <button type="button" className={`pad-tab ${capture ? 'on' : ''}`} onClick={start}>
        {capture ? 'Aperte no controle...' : `Botão de voltar${current ? `: ${LABEL[current]}` : ''}`}
      </button>
      {capture && <span data-pad-capture hidden />}
    </>
  )
}
