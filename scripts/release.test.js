import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const root = path.join(__dirname, '..')
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
const changelog = fs.readFileSync(path.join(root, 'CHANGELOG.md'), 'utf8')

describe('versão lançada', () => {
  it('a versão do package.json é a primeira do CHANGELOG, com data', () => {
    const first = /^## (\d+\.\d+\.\d+) — (\d{4}-\d{2}-\d{2})$/m.exec(changelog)
    expect(first?.[1]).toBe(pkg.version)
  })
  it('"Próxima versão" (mudanças ainda não lançadas) só pode ficar no topo, acima das lançadas', () => {
    const next = changelog.indexOf('## Próxima versão')
    const first = changelog.search(/^## \d+\.\d+\.\d+/m)
    expect(next === -1 || next < first).toBe(true)
    expect(changelog.split('## Próxima versão').length).toBeLessThanOrEqual(2)
  })
})

describe('instalador do Windows (x64, Windows 10 e 11)', () => {
  const win = pkg.build.win
  const targets = Object.fromEntries(win.target.map((t) => [t.target, t.arch]))
  it('gera o instalador (NSIS) e o portátil, os dois em 64 bits', () => {
    expect(targets).toEqual({ nsis: ['x64'], portable: ['x64'] })
  })
  it('instalador por usuário (sem pedir administrador), escolhendo a pasta, com atalhos e desinstalador', () => {
    expect(pkg.build.nsis).toMatchObject({
      oneClick: false, perMachine: false, allowToChangeInstallationDirectory: true,
      createDesktopShortcut: true, createStartMenuShortcut: true, shortcutName: 'Laaazy',
      installerIcon: 'build/icon.ico', uninstallerIcon: 'build/icon.ico',
    })
  })
  it('nomes dos arquivos sem espaço, com a versão e a arquitetura', () => {
    expect(pkg.build.nsis.artifactName).toBe('Laaazy-Setup-${version}-x64.${ext}')
    expect(pkg.build.portable.artifactName).toBe('Laaazy-${version}-x64-portatil.${ext}')
  })
})

