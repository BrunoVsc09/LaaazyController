'use client'

// Boas-vindas, passo 5: as chaves grátis (TMDB recomendada; Gemini, YouTube e SteamGridDB opcionais).
// A chave é colada aqui mesmo e guardada criptografada pelo Electron; remover fica nas Configurações.
import { useEffect, useState } from 'react'
import ApiCard from './ApiCard'
import { APIS } from '../../lib/onboarding'
import { getLazy, type Result } from '../../lib/lazy-api'
import type { Sounds } from '../../hooks/useSounds'

type Api = (typeof APIS)[number]['id']

export default function ApisStep({ sounds, onMsg }: { sounds: Sounds; onMsg: (msg: string) => void }) {
  const lazy = getLazy()
  const [on, setOn] = useState<Record<Api, boolean>>({ tmdb: false, gemini: false, youtube: false, steamgrid: false })
  useEffect(() => {
    if (!lazy) return
    Promise.all([lazy.catalog.status(), lazy.ai.status(), lazy.yt.status(), lazy.covers.status()])
      .then(([t, g, y, c]) => setOn({ tmdb: t.configured, gemini: g.configured, youtube: y.configured, steamgrid: c.configured }))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const keys: Record<Api, { save: (k: string) => Promise<Result> }> = {
    tmdb: { save: (k) => lazy!.catalog.setKey(k) },
    gemini: { save: (k) => lazy!.ai.setKey(k) },
    youtube: { save: (k) => lazy!.yt.setKey(k) },
    steamgrid: { save: (k) => lazy!.covers.setKey(k) },
  }

  return (
    <div className="welcome-apis">
      <h2>Filmes, IA e capas</h2>
      <p className="welcome-muted">Chaves grátis que ligam partes do Laaazy. Só a do TMDB é recomendada; as outras você pode pular e pôr depois em Configurações. Copie a chave no PC e use "Colar e salvar", ou ✕ no campo para digitar.</p>
      <div className="welcome-grid2" style={{ marginTop: 14 }}>
        {APIS.map((a) => (
          <ApiCard key={a.id} title={a.title} what={a.what} where={a.where} required={a.required} configured={on[a.id]} sounds={sounds}
            note={a.id === 'tmdb' ? 'Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB.' : undefined}
            onSave={keys[a.id].save} onResult={(m, ok) => { onMsg(m); setOn((cur) => ({ ...cur, [a.id]: ok })) }} />
        ))}
      </div>
    </div>
  )
}
