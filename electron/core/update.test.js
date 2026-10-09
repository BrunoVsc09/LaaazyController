import { describe, it, expect } from 'vitest'
import mod from './update.js'

const { isNewer, pickRelease, parseSha256, setupName } = mod

// Atualização pelo GitHub (pedido do Bruno, 2026-10-09): ao abrir, o Laaazy confere se há versão nova
describe('isNewer', () => {
  it('compara número a número (não como texto)', () => {
    expect(isNewer('3.5.0', '3.6.0')).toBe(true)
    expect(isNewer('3.5.0', '3.10.0')).toBe(true)
    expect(isNewer('3.5.9', '4.0.0')).toBe(true)
    expect(isNewer('3.5.0', 'v3.5.1')).toBe(true)
  })
  it('mesma versão ou mais velha: não atualiza', () => {
    expect(isNewer('3.5.0', '3.5.0')).toBe(false)
    expect(isNewer('3.6.0', '3.5.9')).toBe(false)
  })
  it('versão estranha: não atualiza', () => {
    expect(isNewer('3.5.0', 'beta')).toBe(false)
    expect(isNewer('3.5.0', '3.6')).toBe(false)
    expect(isNewer('3.5.0', undefined)).toBe(false)
  })
})

const BASE = 'https://github.com/BrunoVsc09/LaaazyController/releases/download/v3.6.0/'
const asset = (name, url = BASE + name) => ({ name, browser_download_url: url, size: 1000 })
const release = (over = {}) => ({
  tag_name: 'v3.6.0', draft: false, prerelease: false,
  html_url: 'https://github.com/BrunoVsc09/LaaazyController/releases/tag/v3.6.0',
  assets: [asset('Laaazy-Setup-3.6.0-x64.exe'), asset('Laaazy-Setup-3.6.0-x64.exe.sha256'), asset('Laaazy-3.6.0-x64-portatil.exe')],
  ...over,
})

describe('pickRelease: o que baixar da última versão no GitHub', () => {
  it('versão, instalador, impressão digital e a página da versão', () => {
    expect(pickRelease(release())).toEqual({
      version: '3.6.0',
      setupName: 'Laaazy-Setup-3.6.0-x64.exe',
      setupUrl: BASE + 'Laaazy-Setup-3.6.0-x64.exe',
      size: 1000,
      shaUrl: BASE + 'Laaazy-Setup-3.6.0-x64.exe.sha256',
      page: 'https://github.com/BrunoVsc09/LaaazyController/releases/tag/v3.6.0',
    })
  })
  it('sem instalador ou sem a impressão digital: nada a oferecer', () => {
    expect(pickRelease(release({ assets: [asset('Laaazy-Setup-3.6.0-x64.exe')] }))).toBeNull()
    expect(pickRelease(release({ assets: [asset('Laaazy-Setup-3.6.0-x64.exe.sha256')] }))).toBeNull()
  })
  it('rascunho, pré-versão ou tag sem versão: ignora', () => {
    expect(pickRelease(release({ draft: true }))).toBeNull()
    expect(pickRelease(release({ prerelease: true }))).toBeNull()
    expect(pickRelease(release({ tag_name: 'teste' }))).toBeNull()
    expect(pickRelease(null)).toBeNull()
  })
  it('só baixa do repositório do Laaazy no GitHub (endereço de outro lugar é recusado)', () => {
    const fora = release({ assets: [asset('Laaazy-Setup-3.6.0-x64.exe', 'https://exemplo.com/Laaazy-Setup-3.6.0-x64.exe'), asset('Laaazy-Setup-3.6.0-x64.exe.sha256')] })
    expect(pickRelease(fora)).toBeNull()
    const http = release({ assets: [asset('Laaazy-Setup-3.6.0-x64.exe', BASE.replace('https', 'http') + 'Laaazy-Setup-3.6.0-x64.exe'), asset('Laaazy-Setup-3.6.0-x64.exe.sha256')] })
    expect(pickRelease(http)).toBeNull()
  })
})

describe('parseSha256: impressão digital do instalador', () => {
  const hex = 'a'.repeat(64)
  it('aceita só o código ou "código  nome-do-arquivo" (formato do sha256sum)', () => {
    expect(parseSha256(hex)).toBe(hex)
    expect(parseSha256(`${'AB'.repeat(32)}  Laaazy-Setup-3.6.0-x64.exe\r\n`)).toBe('ab'.repeat(32))
  })
  it('qualquer outra coisa: null', () => {
    expect(parseSha256('123')).toBeNull()
    expect(parseSha256('')).toBeNull()
    expect(parseSha256(undefined)).toBeNull()
  })
})

describe('setupName', () => {
  it('o mesmo nome que o package.json dá ao instalador', () => {
    expect(setupName('3.6.0')).toBe('Laaazy-Setup-3.6.0-x64.exe')
  })
})
