import { describe, it, expect } from 'vitest'
import crypto from 'node:crypto'
import os from 'node:os'
import path from 'node:path'
import mod from './make-release.js'
import rules from '../electron/core/update.js'

const { changesFor, shaFile, releaseNotes, signatureFor, keyPath, keyModule } = mod

const CHANGELOG = `# Novidades do Laaazy

## Próxima versão (ainda não lançada)

### Novo
- coisa futura

## 3.6.0 — 2026-10-10

### Novo
- **Atualização:** o Laaazy avisa quando há versão nova.

## 3.5.0 — 2026-10-09

### Mudou
- antiga
`

// pnpm release (pedido do Bruno, 2026-10-09): prepara o que sobe na release do GitHub
describe('make-release', () => {
  it('changesFor: só o trecho da versão no CHANGELOG (sem o título)', () => {
    expect(changesFor(CHANGELOG, '3.6.0')).toBe('### Novo\n- **Atualização:** o Laaazy avisa quando há versão nova.')
    expect(changesFor(CHANGELOG.replace(/\n/g, '\r\n'), '3.5.0')).toBe('### Mudou\n- antiga')
  })
  it('changesFor: versão sem data no CHANGELOG (ainda "Próxima versão") é erro', () => {
    expect(() => changesFor(CHANGELOG, '3.7.0')).toThrow('O CHANGELOG não tem a seção "## 3.7.0 — data".')
  })
  it('shaFile: formato do sha256sum, que o Laaazy lê para conferir o download', () => {
    expect(shaFile('ab'.repeat(32), 'Laaazy-Setup-3.6.0-x64.exe')).toBe(`${'ab'.repeat(32)}  Laaazy-Setup-3.6.0-x64.exe\n`)
  })
  it('releaseNotes: download, avisos, novidades e a impressão digital', () => {
    const notes = releaseNotes({ version: '3.6.0', changes: '### Novo\n- x', sha: 'ab'.repeat(32) })
    expect(notes).toContain('| **Laaazy-Setup-3.6.0-x64.exe** |')
    expect(notes).toContain('| **Laaazy-3.6.0-x64-portatil.exe** |')
    expect(notes).toContain('Mais informações → Executar assim mesmo')
    expect(notes).toContain('### Novo\n- x')
    expect(notes).toContain(`${'ab'.repeat(32)}  Laaazy-Setup-3.6.0-x64.exe`)
  })
})

// Assinatura (pedido do Bruno, 2026-10-09): a chave privada fica no PC do Bruno, fora do projeto
describe('make-release: assinatura', () => {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519')
  const priv = privateKey.export({ type: 'pkcs8', format: 'pem' })
  const pub = publicKey.export({ type: 'spki', format: 'pem' })
  it('signatureFor: o Laaazy aceita (com a chave pública que leva dentro)', () => {
    const sha = 'ab'.repeat(32)
    expect(rules.verifyRelease({ version: '3.6.0', sha, signature: signatureFor(priv, '3.6.0', sha) }, pub)).toBe(true)
  })
  it('keyPath: na pasta do usuário, fora do projeto (ou onde LAAAZY_RELEASE_KEY mandar)', () => {
    expect(keyPath({}, 'C:/Users/b')).toBe(path.join('C:/Users/b', '.laaazy', 'release-key.pem'))
    expect(keyPath({ LAAAZY_RELEASE_KEY: 'E:/chave.pem' }, 'C:/Users/b')).toBe('E:/chave.pem')
    expect(keyPath({}, os.homedir())).not.toContain('lazy-ps4')
  })
  it('keyModule: o arquivo com a chave pública que vai para electron/core/release-key.js', () => {
    const text = keyModule(pub)
    expect(text).toContain('RELEASE_PUBLIC_KEY')
    expect(text).not.toMatch(/PRIVATE/)
    const m = { exports: {} }
    new Function('module', text)(m)
    expect(m.exports.RELEASE_PUBLIC_KEY).toBe(pub)
  })
})
