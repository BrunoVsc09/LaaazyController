import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import mod from './folder-files.js'

describe('folder-files', () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'laaazy-ext-'))
  it('cria a pasta e grava cada arquivo (substitui o que já estava)', async () => {
    const dir = path.join(base, 'edge-ext')
    await mod.writeFiles(dir, { 'a.txt': 'um', 'b.css': 'dois' })
    await mod.writeFiles(dir, { 'a.txt': 'três' })
    expect(fs.readFileSync(path.join(dir, 'a.txt'), 'utf8')).toBe('três')
    expect(fs.readFileSync(path.join(dir, 'b.css'), 'utf8')).toBe('dois')
  })
  it('nome que sairia da pasta: recusa', async () => {
    await expect(mod.writeFiles(path.join(base, 'x'), { '../fora.txt': 'não' })).rejects.toThrow(/inválido/)
    expect(fs.existsSync(path.join(base, 'fora.txt'))).toBe(false)
  })
})
