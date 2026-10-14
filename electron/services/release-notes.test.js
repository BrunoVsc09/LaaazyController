import { describe, it, expect } from 'vitest'
import mod from './release-notes.js'

const CHANGELOG = '## 3.6.6 — 2026-10-14\n\n### Novo\n- **Equalizador do Windows (pedido do Bruno):** x.\n\n## 3.6.5 — 2026-10-10\n\n### Mudou\n- **Antigo:** y.\n'

function setup({ version = '3.6.6', lastSeen, newUser = false, changelog = CHANGELOG, readFails = false } = {}) {
  const store = lastSeen === undefined ? {} : { lastSeenVersion: lastSeen }
  const svc = mod.createReleaseNotes({
    version: () => version,
    readChangelog: async () => { if (readFails) throw new Error('sem arquivo'); return changelog },
    isNewUser: async () => newUser,
    settings: { get: (k) => store[k] ?? null, set: (k, v) => { store[k] = v; return true } },
  })
  return { svc, store }
}

describe('novidades (serviço)', () => {
  it('atualizou (a última vista era outra): devolve as novidades da versão atual', async () => {
    expect(await setup({ lastSeen: '3.6.5' }).svc.pending()).toEqual({
      version: '3.6.6', date: '2026-10-14', sections: [{ title: 'Novo', items: ['Equalizador do Windows'] }],
    })
  })
  it('"Entendi": guarda a versão e não mostra de novo', async () => {
    const { svc, store } = setup({ lastSeen: '3.6.5' })
    await svc.seen()
    expect(store.lastSeenVersion).toBe('3.6.6')
    expect(await svc.pending()).toBe(null)
  })
  it('primeira instalação: não mostra e já marca a versão como vista (senão aparecia na 2ª vez que abrisse)', async () => {
    const { svc, store } = setup({ newUser: true })
    expect(await svc.pending()).toBe(null)
    expect(store.lastSeenVersion).toBe('3.6.6')
  })
  it('versão sem seção no CHANGELOG (ex.: desenvolvimento): não mostra', async () => {
    expect(await setup({ version: '3.7.0', lastSeen: '3.6.6' }).svc.pending()).toBe(null)
  })
  it('CHANGELOG não abriu: não mostra e não quebra a abertura do Laaazy', async () => {
    expect(await setup({ lastSeen: '3.6.5', readFails: true }).svc.pending()).toBe(null)
  })
})
