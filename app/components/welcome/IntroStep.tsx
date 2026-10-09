'use client'

// Boas-vindas, passo 1: o que é o Laaazy, quem fez (com o GitHub) e o hardware recomendado.
import { Cpu, Film, Gamepad2, Monitor, Sparkles, Tv, Wifi } from 'lucide-react'
import { CREATOR, HARDWARE } from '../../lib/onboarding'
import { getLazy } from '../../lib/lazy-api'
import type { Sounds } from '../../hooks/useSounds'

const HW_ICON = { sistema: Monitor, desempenho: Cpu, tela: Tv, controle: Gamepad2, internet: Wifi } as const

// Marca do GitHub (o pacote de ícones do app não tem marcas)
const GitHubMark = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" /></svg>
)

export default function IntroStep({ sounds }: { sounds: Sounds }) {
  const openGitHub = () => { sounds.click(); void getLazy()?.open(CREATOR.github, 'GitHub') }
  return (
    <>
      <div className="welcome-hero">
        <img className="welcome-logo" src="/icon.svg" alt="Logo do Laaazy: um controle dormindo na cama" />
        <div>
          <span className="welcome-hello">Olá!</span>
          <h1>Bem-vindo ao Laaazy</h1>
          <p className="welcome-lead">
            O Laaazy nasceu para transformar o seu PC num console: filmes, séries, animes, jogos e apps numa tela só,
            feita para a TV e para o controle. Sem teclado, sem mouse, direto do sofá.
          </p>
          <div className="welcome-chips">
            <span><Film size={18} aria-hidden="true" /> Filmes, séries e animes</span>
            <span><Gamepad2 size={18} aria-hidden="true" /> Seus jogos num lugar só</span>
            <span><Sparkles size={18} aria-hidden="true" /> IA que acha parecidos</span>
          </div>
        </div>
      </div>
      <div className="welcome-split">
        <section className="welcome-box" aria-label="Quem fez">
          <h3>Quem fez</h3>
          <div className="welcome-creator">
            <img src="/icon.svg" alt="" width={48} height={48} style={{ borderRadius: 12 }} />
            <div><b>{CREATOR.name}</b><span className="welcome-muted">{CREATOR.role}</span></div>
          </div>
          <p className="welcome-muted" style={{ margin: 0, lineHeight: 1.5 }}>{CREATOR.text}</p>
          <button type="button" className="welcome-gh" onClick={openGitHub} onMouseEnter={sounds.hover}>
            <GitHubMark /> github.com/{CREATOR.handle}
          </button>
        </section>
        <section className="welcome-box" aria-label="Recomendado">
          <h3>Recomendado para usar</h3>
          <div className="welcome-hw">
            {HARDWARE.map((h) => {
              const Icon = HW_ICON[h.id as keyof typeof HW_ICON]
              return <div key={h.id}><Icon aria-hidden="true" /><b>{h.title}</b><small>{h.text}</small></div>
            })}
          </div>
        </section>
      </div>
    </>
  )
}
