import { describe, it, expect, beforeEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import mod from './apo-files.js'

let dir
beforeEach(() => { dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lazy-apo-')) })

// Registro falso: { ConfigPath, InstallPath } da chave do Equalizer APO
const fakeReg = (values) => async (key, name) => (key === mod.APO_KEY ? values[name] ?? null : null)

describe('apo-files: achar a pasta do Equalizer APO', () => {
  it('usa o ConfigPath do registro', async () => {
    expect(await mod.findConfigDir(fakeReg({ ConfigPath: dir }))).toBe(dir)
  })
  it('sem ConfigPath, tenta a pasta config dentro da instalação', async () => {
    fs.mkdirSync(path.join(dir, 'config'))
    expect(await mod.findConfigDir(fakeReg({ InstallPath: dir }))).toBe(path.join(dir, 'config'))
  })
  it('APO não instalado: null', async () => {
    expect(await mod.findConfigDir(fakeReg({}))).toBe(null)
  })
  it('registro aponta para pasta apagada: null', async () => {
    expect(await mod.findConfigDir(fakeReg({ ConfigPath: path.join(dir, 'apagada') }))).toBe(null)
  })
})

describe('apo-files: ler e gravar', () => {
  it('arquivo ausente é lido como texto vazio', async () => {
    expect(await mod.readText(path.join(dir, 'config.txt'))).toBe('')
  })
  it('grava e lê o mesmo texto, sem deixar .tmp para trás', async () => {
    const f = path.join(dir, 'laaazy.txt')
    expect(await mod.writeText(f, 'Preamp: 0.0 dB\n')).toEqual({ ok: true })
    expect(await mod.readText(f)).toBe('Preamp: 0.0 dB\n')
    expect(fs.readdirSync(dir)).toEqual(['laaazy.txt'])
  })
  it('falha ao gravar (pasta sem permissão, por exemplo) vira { ok: false, code } em vez de exceção', async () => {
    const r = await mod.writeText(path.join(dir, 'nao', 'existe', 'laaazy.txt'), 'x')
    expect(r.ok).toBe(false)
    expect(r.code).toBe('ENOENT')
    expect(fs.readdirSync(dir)).toEqual([])
  })
})
