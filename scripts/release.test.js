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
  it('nada fica em "Próxima versão" depois de lançar', () => {
    const next = changelog.indexOf('## Próxima versão')
    const first = changelog.search(/^## \d+\.\d+\.\d+/m)
    expect(next === -1 || next > first).toBe(true)
  })
})
