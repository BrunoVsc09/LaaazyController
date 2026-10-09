import { describe, it, expect } from 'vitest'
import mod from './make-release.js'

const { changesFor, shaFile, releaseNotes } = mod

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
