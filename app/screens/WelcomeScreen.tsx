'use client'

// Boas-vindas: aparece na primeira vez que o Laaazy abre (e em Configurações → Ver as boas-vindas).
// ✕ escolhe, ○ volta um passo; no último passo, "Ir para o Início" marca as boas-vindas como feitas.
import { useEffect, useState } from 'react'
import IntroStep from '../components/welcome/IntroStep'
import ProfileStep from '../components/welcome/ProfileStep'
import ThemeStep from '../components/welcome/ThemeStep'
import ControllerStep from '../components/welcome/ControllerStep'
import ApisStep from '../components/welcome/ApisStep'
import { WELCOME_STEPS, nameError, stepAfter, stepBefore, type WelcomeStep } from '../lib/onboarding'
import { themeOf } from '../lib/theme'
import { getLazy, type UserProfile, type UserResult } from '../lib/lazy-api'
import type { Sounds } from '../hooks/useSounds'

type Props = { sounds: Sounds; onDone: () => void }
const userChanged = () => window.dispatchEvent(new Event('lz:user-changed'))

export default function WelcomeScreen({ sounds, onDone }: Props) {
  const lazy = getLazy()
  const [step, setStep] = useState<WelcomeStep>('intro')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [name, setName] = useState('')
  const [theme, setTheme] = useState('azul')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    lazy?.user.get().then((p) => { setProfile(p); setName(p.name) })
    lazy?.settings.get().then((s) => setTheme(themeOf(s.theme)))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ○ do controle (a tela principal manda lz:welcome-back): passo anterior
  useEffect(() => {
    const back = () => { setMsg(''); setStep((s) => stepBefore(s)) }
    window.addEventListener('lz:welcome-back', back)
    return () => window.removeEventListener('lz:welcome-back', back)
  }, [])
  // Cada passo novo começa com o foco no Continuar (no perfil, no campo do nome)
  useEffect(() => {
    window.setTimeout(() => document.querySelector<HTMLElement>(step === 'perfil' ? '.welcome-name' : '.welcome-nav .primary')?.focus(), 0)
  }, [step])

  const onResult = (r: UserResult) => {
    if (r.profile) { setProfile(r.profile); userChanged() }
    setMsg(r.ok ? '' : r.msg ?? '')
  }

  async function next() {
    sounds.click()
    if (step === 'perfil' && profile && name.trim() !== profile.name) {
      const err = nameError(name)
      if (err) return setMsg(err)
      const r = await lazy?.user.set({ name })
      if (r) onResult(r)
      if (r && !r.ok) return
    }
    if (step === 'pronto') {
      await lazy?.user.finish()
      userChanged()
      return onDone()
    }
    setMsg('')
    setStep(stepAfter(step))
  }

  const index = WELCOME_STEPS.findIndex((s) => s.id === step)
  return (
    <section className="welcome" aria-label="Boas-vindas">
      <header className="welcome-top">
        <img src="/icon.svg" alt="" />
        <strong>Laaazy</strong>
        <span className="welcome-step">Passo {index + 1} de {WELCOME_STEPS.length} · {WELCOME_STEPS[index].title}</span>
        <div className="welcome-dots" aria-hidden="true">{WELCOME_STEPS.map((s, i) => <i key={s.id} className={i <= index ? 'on' : ''} />)}</div>
      </header>
      <div className="welcome-body">
        <div className="welcome-card">
          {step === 'intro' && <IntroStep sounds={sounds} />}
          {step === 'perfil' && profile && <ProfileStep sounds={sounds} profile={profile} name={name} onName={setName} onResult={onResult} />}
          {step === 'cor' && <ThemeStep sounds={sounds} theme={theme} onTheme={setTheme} />}
          {step === 'controle' && <ControllerStep />}
          {step === 'apis' && <ApisStep sounds={sounds} onMsg={setMsg} />}
          {step === 'pronto' && (
            <>
              <h1>Tudo pronto, {profile?.name ?? name}!</h1>
              <p className="welcome-lead">Seu Laaazy está configurado. No Início ficam os filmes e séries dos seus apps, na Biblioteca os seus jogos, e o PS sempre traz você de volta.</p>
            </>
          )}
          {msg && <p className="welcome-msg" role="status">{msg}</p>}
        </div>
      </div>
      <nav className="welcome-nav">
        {index > 0 && <button type="button" className="welcome-btn" onClick={() => { sounds.click(); setMsg(''); setStep(stepBefore(step)) }}>Voltar</button>}
        <button type="button" className="welcome-btn primary" onClick={next}>
          {step === 'intro' ? 'Começar' : step === 'pronto' ? 'Ir para o Início' : 'Continuar'}
        </button>
      </nav>
    </section>
  )
}
