import { describe, it, expect } from 'vitest'
import crypto from 'node:crypto'
import mod from './release-key.js'

// A chave pública das atualizações (pnpm release-key) vai dentro do Laaazy; a privada nunca
describe('chave das atualizações', () => {
  it('é vazia (sem chave, nada é oferecido) ou uma chave pública Ed25519 de verdade', () => {
    const pem = mod.RELEASE_PUBLIC_KEY
    if (!pem) return
    expect(crypto.createPublicKey(pem).asymmetricKeyType).toBe('ed25519')
  })
  it('nunca uma chave privada', () => {
    expect(mod.RELEASE_PUBLIC_KEY).not.toMatch(/PRIVATE/)
  })
})
