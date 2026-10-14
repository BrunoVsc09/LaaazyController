import { describe, it, expect, beforeEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import mod from './apo-files.js'

let dir
beforeEach(() => { dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lazy-apo-')) })

// Registro falso: { ConfigPath, InstallPath } da chave do Equalizer APO
const fakeReg = (values) => async (key, name) => (key === mod.APO_KEY ? values[name] ?? null : null)

// Instalação de verdade: pasta config + Uninstall.exe (o desinstalador apaga o .exe)
function installed() {
  fs.mkdirSync(path.join(dir, 'config'))
  fs.writeFileSync(path.join(dir, 'Uninstall.exe'), '')
  return { InstallPath: dir, ConfigPath: path.join(dir, 'config') }
}

describe('apo-files: achar a pasta do Equalizer APO', () => {
  it('usa o ConfigPath do registro', async () => {
    expect(await mod.findConfigDir(fakeReg(installed()))).toBe(path.join(dir, 'config'))
  })
  it('sem ConfigPath, tenta a pasta config dentro da instalação', async () => {
    const { InstallPath } = installed()
    expect(await mod.findConfigDir(fakeReg({ InstallPath }))).toBe(path.join(dir, 'config'))
  })
  it('APO não instalado: null', async () => {
    expect(await mod.findConfigDir(fakeReg({}))).toBe(null)
  })
  it('registro aponta para pastas apagadas: null', async () => {
    expect(await mod.findConfigDir(fakeReg({ InstallPath: path.join(dir, 'apagada'), ConfigPath: path.join(dir, 'apagada', 'config') }))).toBe(null)
  })
  // Regressão (PC do Bruno, 2026-10-14): o desinstalador do APO deixa a chave do registro, a pasta
  // config e DLLs em uso; só os .exe somem. O Laaazy achava que ainda estava instalado e escondia o "Instalar"
  it('desinstalado com restos (registro e pasta config ficaram, Uninstall.exe sumiu): null', async () => {
    const reg = installed()
    fs.rmSync(path.join(dir, 'Uninstall.exe'))
    expect(await mod.findConfigDir(fakeReg(reg))).toBe(null)
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

// "Sem permissão para gravar" com as permissões certas (Bruno, 2026-10-14): no Windows a troca do .tmp
// pelo arquivo falha com EPERM/EACCES/EBUSY quando outro programa (antivírus, o próprio APO relendo)
// segura um dos arquivos naquele instante. Tenta de novo antes de desistir
describe('apo-files: gravar com o arquivo em uso por um instante', () => {
  const failing = (codes) => {
    const calls = []
    const rename = async (from, to) => {
      calls.push(to)
      const code = codes.shift()
      if (code) throw Object.assign(new Error(code), { code })
      fs.renameSync(from, to)
    }
    return { rename, calls }
  }
  it('erro passageiro (EPERM, EBUSY): tenta de novo e grava', async () => {
    const f = path.join(dir, 'laaazy.txt')
    const { rename, calls } = failing(['EPERM', 'EBUSY'])
    expect(await mod.writeText(f, 'Preamp: 0.0 dB\n', { rename, waitMs: 0 })).toEqual({ ok: true })
    expect(calls).toHaveLength(3)
    expect(fs.readFileSync(f, 'utf8')).toBe('Preamp: 0.0 dB\n')
  })
  it('continua falhando: desiste depois de algumas tentativas, apaga o .tmp e devolve o código', async () => {
    const f = path.join(dir, 'laaazy.txt')
    const { rename, calls } = failing(Array(20).fill('EACCES'))
    expect(await mod.writeText(f, 'x', { rename, waitMs: 0 })).toEqual({ ok: false, code: 'EACCES' })
    expect(calls).toHaveLength(6)
    expect(fs.readdirSync(dir)).toEqual([])
  })
  it('erro que não passa sozinho (pasta não existe): não fica tentando', async () => {
    const { rename, calls } = failing(['ENOENT'])
    const r = await mod.writeText(path.join(dir, 'laaazy.txt'), 'x', { rename, waitMs: 0 })
    expect(r).toEqual({ ok: false, code: 'ENOENT' })
    expect(calls).toHaveLength(1)
  })
})
