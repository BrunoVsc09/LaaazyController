import { describe, it, expect } from 'vitest'
import mod from './secret-store.js'

function make(available = true) {
  let stored = {}
  const safeStorage = {
    isEncryptionAvailable: () => available,
    encryptString: (s) => Buffer.from('enc:' + s),
    decryptString: (b) => b.toString().replace(/^enc:/, ''),
  }
  const store = mod.createSecretStore({ safeStorage, read: () => stored, write: (d) => { stored = d; return true } })
  return { store, raw: () => stored }
}

describe('secret-store', () => {
  it('guarda criptografado e lê de volta', () => {
    const { store, raw } = make()
    expect(store.set('tmdb', 'MINHA-CHAVE')).toBe(true)
    expect(JSON.stringify(raw())).not.toContain('MINHA-CHAVE')
    expect(store.get('tmdb')).toBe('MINHA-CHAVE')
  })
  it('sem criptografia disponível, recusa salvar (nunca em texto puro)', () => {
    const { store, raw } = make(false)
    expect(store.set('tmdb', 'MINHA-CHAVE')).toBe(false)
    expect(raw()).toEqual({})
  })
  it('chave ausente ou corrompida devolve vazio', () => {
    const { store } = make()
    expect(store.get('tmdb')).toBe('')
  })
  it('clear apaga', () => {
    const { store } = make()
    store.set('tmdb', 'X')
    store.clear('tmdb')
    expect(store.get('tmdb')).toBe('')
  })
})
