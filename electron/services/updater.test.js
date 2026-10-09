import { describe, it, expect, vi } from 'vitest'
import crypto from 'node:crypto'
import mod from './updater.js'
import rules from '../core/update.js'

const BASE = 'https://github.com/BrunoVsc09/LaaazyController/releases/download/v3.6.0/'
const SETUP = 'Laaazy-Setup-3.6.0-x64.exe'
const HASH = 'ab'.repeat(32)
const file = (name) => ({ name, browser_download_url: BASE + name, size: 10 })
const latest = {
  tag_name: 'v3.6.0', draft: false, prerelease: false, html_url: 'https://github.com/BrunoVsc09/LaaazyController/releases/tag/v3.6.0',
  assets: [file(SETUP), file(SETUP + '.sha256'), file(SETUP + '.sig')],
}
// Chave de teste (a de verdade é do Bruno e fica fora do projeto)
const keys = crypto.generateKeyPairSync('ed25519')
const PUBLIC = keys.publicKey.export({ type: 'spki', format: 'pem' })
const signed = (version, sha, key = keys.privateKey) => crypto.sign(null, Buffer.from(rules.signedMessage(version, sha)), key).toString('base64')

function make({ version = '3.5.0', mode = 'installer', release = latest, fetchFails = false, fileHash = HASH, shaText = `${HASH}  ${SETUP}`, sigText = signed('3.6.0', HASH), publicKey = PUBLIC } = {}) {
  const deps = {
    currentVersion: () => version,
    mode: () => mode,
    publicKey: () => publicKey,
    fetchJson: vi.fn(async () => { if (fetchFails) throw new Error('sem internet'); return release }),
    fetchText: vi.fn(async (url) => (url.endsWith('.sig') ? sigText : shaText)),
    download: vi.fn(async () => {}),
    hashFile: vi.fn(async () => fileHash),
    removeFile: vi.fn(async () => {}),
    tempDir: () => 'C:\\Temp',
    runInstaller: vi.fn(async () => ''),
    quit: vi.fn(),
    openExternal: vi.fn(async () => {}),
  }
  return { up: mod.createUpdater(deps), deps }
}

// Atualização (pedido do Bruno, 2026-10-09): ao abrir, pergunta ao GitHub; "Atualizar" baixa e instala
describe('updater.check', () => {
  it('versão nova no GitHub: oferece, dizendo se dá para instalar daqui', async () => {
    expect(await make().up.check()).toEqual({ available: true, version: '3.6.0', canInstall: true })
    expect(await make({ mode: 'portable' }).up.check()).toEqual({ available: true, version: '3.6.0', canInstall: false })
  })
  it('já está na última: nada', async () => {
    expect(await make({ version: '3.6.0' }).up.check()).toEqual({ available: false })
  })
  it('sem internet ou release incompleta: nada (sem incomodar)', async () => {
    expect(await make({ fetchFails: true }).up.check()).toEqual({ available: false })
    expect(await make({ release: { ...latest, assets: [] } }).up.check()).toEqual({ available: false })
  })
  it('rodando pelo pnpm app (desenvolvimento): nem pergunta ao GitHub', async () => {
    const { up, deps } = make({ mode: 'dev' })
    expect(await up.check()).toEqual({ available: false })
    expect(deps.fetchJson).not.toHaveBeenCalled()
  })
})

describe('updater.install', () => {
  it('baixa o instalador, confere a impressão digital, roda o instalador e fecha o Laaazy', async () => {
    const { up, deps } = make()
    await up.check()
    expect(await up.install()).toEqual({ ok: true, msg: '' })
    const file = 'C:\\Temp\\' + SETUP
    expect(deps.download).toHaveBeenCalledWith(BASE + SETUP, file)
    expect(deps.fetchText).toHaveBeenCalledWith(BASE + SETUP + '.sha256')
    expect(deps.hashFile).toHaveBeenCalledWith(file)
    expect(deps.runInstaller).toHaveBeenCalledWith(file)
    expect(deps.quit).toHaveBeenCalled()
  })
  it('impressão digital diferente: apaga o arquivo e não instala', async () => {
    const { up, deps } = make({ fileHash: 'cd'.repeat(32) })
    await up.check()
    expect(await up.install()).toEqual({ ok: false, msg: 'O instalador baixado não confere com o publicado. Nada foi instalado; tente de novo mais tarde.' })
    expect(deps.removeFile).toHaveBeenCalledWith('C:\\Temp\\' + SETUP)
    expect(deps.runInstaller).not.toHaveBeenCalled()
    expect(deps.quit).not.toHaveBeenCalled()
  })
  it('arquivo .sha256 estranho: não instala', async () => {
    const { up, deps } = make({ shaText: 'oi' })
    await up.check()
    expect((await up.install()).ok).toBe(false)
    expect(deps.runInstaller).not.toHaveBeenCalled()
  })
  it('falha ao baixar ou ao abrir o instalador: mensagem, e o Laaazy continua aberto', async () => {
    const a = make()
    a.deps.download.mockRejectedValue(new Error('caiu a conexão'))
    await a.up.check()
    expect(await a.up.install()).toEqual({ ok: false, msg: 'Não consegui baixar a atualização: caiu a conexão' })
    const b = make()
    b.deps.runInstaller.mockResolvedValue('acesso negado')
    await b.up.check()
    expect(await b.up.install()).toEqual({ ok: false, msg: 'Não consegui abrir o instalador: acesso negado' })
    expect(b.deps.quit).not.toHaveBeenCalled()
  })
  it('portátil: não se instala sozinho, abre a página da versão no GitHub', async () => {
    const { up, deps } = make({ mode: 'portable' })
    await up.check()
    expect(await up.install()).toEqual({ ok: true, msg: '' })
    expect(deps.openExternal).toHaveBeenCalledWith(latest.html_url)
    expect(deps.download).not.toHaveBeenCalled()
  })
  it('sem versão nova conferida antes: não faz nada', async () => {
    const { up, deps } = make({ version: '3.6.0' })
    await up.check()
    expect(await up.install()).toEqual({ ok: false, msg: 'Não há atualização para instalar.' })
    expect(deps.download).not.toHaveBeenCalled()
  })
  it('apertar Atualizar duas vezes baixa uma vez só', async () => {
    const { up, deps } = make()
    await up.check()
    await Promise.all([up.install(), up.install()])
    expect(deps.download).toHaveBeenCalledTimes(1)
  })
})

// Assinatura (pedido do Bruno, 2026-10-09): só instala o que a chave do Bruno assinou
describe('updater: assinatura', () => {
  it('sem a chave pública no Laaazy: nem oferece atualização', async () => {
    const { up, deps } = make({ publicKey: '' })
    expect(await up.check()).toEqual({ available: false })
    expect(deps.fetchJson).not.toHaveBeenCalled()
  })
  it('assinada por outra chave (ex.: alguém com acesso ao GitHub): apaga e não instala', async () => {
    const outra = crypto.generateKeyPairSync('ed25519').privateKey
    const { up, deps } = make({ sigText: signed('3.6.0', HASH, outra) })
    await up.check()
    expect(await up.install()).toEqual({ ok: false, msg: 'A atualização não tem a assinatura do Laaazy. Nada foi instalado.' })
    expect(deps.removeFile).toHaveBeenCalled()
    expect(deps.runInstaller).not.toHaveBeenCalled()
  })
  it('assinatura de outra versão (instalador velho republicado como novo): não instala', async () => {
    const { up, deps } = make({ sigText: signed('3.5.0', HASH) })
    await up.check()
    expect((await up.install()).ok).toBe(false)
    expect(deps.runInstaller).not.toHaveBeenCalled()
  })
  it('confere a assinatura baixada do .sig da release', async () => {
    const { up, deps } = make()
    await up.check()
    await up.install()
    expect(deps.fetchText).toHaveBeenCalledWith(BASE + SETUP + '.sig')
    expect(deps.runInstaller).toHaveBeenCalled()
  })
})
