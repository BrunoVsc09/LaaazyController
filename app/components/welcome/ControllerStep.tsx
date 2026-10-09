'use client'

// Boas-vindas, passo 4: o controle. Os perfis do Laaazy-pad (Jogos e PC) e onde mudar cada botão.
import { useEffect, useState } from 'react'
import { getLazy } from '../../lib/lazy-api'

export default function ControllerStep() {
  const [status, setStatus] = useState('Procurando o Laaazy-pad...')
  useEffect(() => {
    getLazy()?.ds4.get().then((d) => setStatus(!d.cmd ? 'Laaazy-pad não encontrado: instale para usar o PS e os perfis.' : d.current ? `Laaazy-pad aberto · perfil agora: ${d.current}` : 'Laaazy-pad instalado (ele abre junto com o Laaazy).'))
  }, [])
  return (
    <>
      <h2>Seu controle</h2>
      <p className="welcome-lead">{status}</p>
      <div className="welcome-grid2">
        <section className="welcome-box">
          <h3>Perfil Jogos</h3>
          <p style={{ margin: 0, lineHeight: 1.5 }}>O jogo lê o controle direto. O touchpad move o mouse e o <b>PS</b> volta ao Início de qualquer lugar.</p>
        </section>
        <section className="welcome-box">
          <h3>Perfil PC</h3>
          <p style={{ margin: 0, lineHeight: 1.5 }}>Nos streamings o controle vira mouse: ✕ clica, ○ é o botão direito, <b>Share</b> abre o teclado e <b>L2/R2</b> mudam o volume.</p>
        </section>
      </div>
      <p className="welcome-muted" style={{ marginTop: 16 }}>Para mudar o que cada botão faz, use o ícone do controle no topo do Laaazy.</p>
    </>
  )
}
