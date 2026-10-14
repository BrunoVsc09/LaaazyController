import { describe, it, expect } from 'vitest'
import mod from './equalizer.js'
import core from '../core/equalizer.js'

const DIR = 'C:\\APO\\config'
const APP = `${DIR}\\${core.APP_FILE}`
const MAIN = `${DIR}\\config.txt`

// Timer falso: nada roda sozinho; run() dispara o que estiver pendente
function fakeTimer() {
  const pending = new Map()
  let next = 1
  return {
    later: (fn) => { const id = next++; pending.set(id, fn); return id },
    cancel: (id) => pending.delete(id),
    run: async () => { const fns = [...pending.values()]; pending.clear(); for (const fn of fns) await fn() },
    size: () => pending.size,
  }
}

function setup({ installed = true, files = {}, saved, failWith } = {}) {
  let failure = failWith
  const disk = { ...files }
  const writes = []
  const store = saved ? { equalizer: saved } : {}
  const timer = fakeTimer()
  const eq = mod.createEqualizer({
    findConfigDir: async () => (installed ? DIR : null),
    join: (...p) => p.join('\\'),
    readText: async (f) => disk[f] ?? '',
    writeText: async (f, text) => {
      if (failure) return { ok: false, code: failure }
      writes.push(f); disk[f] = text; return { ok: true }
    },
    settings: { get: (k) => store[k], set: (k, v) => { store[k] = v; return true } },
    later: timer.later,
    cancel: timer.cancel,
  })
  return { eq, disk, writes, store, timer, fail: (code) => { failure = code } }
}

const state = (troca = {}) => ({ ...core.FLAT, ...troca })
const boosted = (db) => state({ preset: 'personalizado', bands: [db, 0, 0, 0, 0, 0, 0, 0, 0, 0] })

describe('equalizador (serviço): status', () => {
  it('sem Equalizer APO: avisa e devolve o estado salvo (ou o plano)', async () => {
    expect(await setup({ installed: false }).eq.status()).toEqual({ installed: false, state: core.FLAT, error: '' })
  })
  it('com APO: devolve o que está salvo', async () => {
    const { eq } = setup({ saved: boosted(3) })
    expect(await eq.status()).toEqual({ installed: true, state: boosted(3), error: '' })
  })
  it('ajuste salvo antes do volume extra existir continua valendo (volume 0)', async () => {
    const antigo = { on: true, preset: 'jogos', bands: [2, 1, -1, 0, 0, 1, 3, 3, 2, 1], bass: 2, clarity: 3 }
    expect((await setup({ saved: antigo }).eq.status()).state).toEqual({ ...antigo, volume: 0 })
  })
  it('estado salvo estragado no settings.json volta para o plano', async () => {
    const { eq } = setup({ saved: { bands: 'x' } })
    expect((await eq.status()).state).toEqual(core.FLAT)
  })
})

describe('equalizador (serviço): mudar', () => {
  it('recusa estado inválido sem salvar nem gravar', async () => {
    const { eq, store, timer } = setup()
    expect(await eq.set({ ...core.FLAT, bass: 99 })).toEqual({ ok: false, msg: 'Ajuste inválido.' })
    expect(store.equalizer).toBeUndefined()
    expect(timer.size()).toBe(0)
  })
  it('salva na hora, mas só grava no APO quando o usuário para de mexer (uma gravação, o último valor)', async () => {
    const { eq, store, writes, disk, timer } = setup()
    for (const db of [1, 2, 3, 4]) expect(await eq.set(boosted(db))).toEqual({ ok: true })
    expect(store.equalizer).toEqual(boosted(4))
    expect(writes).toEqual([])

    await timer.run()
    expect(writes.filter((f) => f === APP)).toEqual([APP])
    expect(disk[APP]).toBe(core.render(boosted(4)))
  })
  it('na primeira gravação põe o Include no config.txt do usuário, sem apagar o que ele tinha', async () => {
    const { eq, disk, timer } = setup({ files: { [MAIN]: 'Preamp: -1 dB\n' } })
    await eq.set(boosted(2))
    await timer.run()
    expect(disk[MAIN]).toBe(`Preamp: -1 dB\n${core.INCLUDE_LINE}\n`)
  })
  it('não regrava o config.txt quando o Include já está lá', async () => {
    const { eq, writes, timer } = setup({ files: { [MAIN]: `${core.INCLUDE_LINE}\n` } })
    await eq.set(boosted(2))
    await timer.run()
    expect(writes).toEqual([APP])
  })
  it('sem APO: salva a escolha (vale quando instalar) e não tenta gravar', async () => {
    const { eq, store, writes, timer } = setup({ installed: false })
    expect(await eq.set(boosted(2))).toEqual({ ok: true })
    await timer.run()
    expect(store.equalizer).toEqual(boosted(2))
    expect(writes).toEqual([])
  })
  it('sem permissão na pasta do APO: o status explica o problema', async () => {
    const { eq, timer } = setup({ failWith: 'EPERM' })
    await eq.set(boosted(2))
    await timer.run()
    // depois das novas tentativas do adapter: pode ser arquivo em uso, não só permissão; o código ajuda a achar a causa
    const error = (await eq.status()).error
    expect(error).toMatch(/em uso ou sem permissão/)
    expect(error).toMatch(/EPERM/)
  })
  it('o erro some quando a gravação seguinte dá certo', async () => {
    const { eq, timer, fail } = setup({ failWith: 'EPERM' })
    await eq.set(boosted(2))
    await timer.run()
    expect((await eq.status()).error).not.toBe('')

    fail(null)
    await eq.set(boosted(3))
    await timer.run()
    expect((await eq.status()).error).toBe('')
  })
})

describe('equalizador (serviço): ao abrir o Laaazy', () => {
  it('reaplica o que estava salvo (o arquivo do APO pode ter sido apagado)', async () => {
    const { eq, disk } = setup({ saved: boosted(5) })
    await eq.start()
    expect(disk[APP]).toBe(core.render(boosted(5)))
  })
  it('sem APO não faz nada', async () => {
    const { eq, writes } = setup({ installed: false, saved: boosted(5) })
    await eq.start()
    expect(writes).toEqual([])
  })
})

// Instalar o Equalizer APO pelo Laaazy (baixa na hora, confere o SHA-256, roda com /S como administrador)
function setupInstall({ installed = false, hash = core.APO_SETUP.sha256, downloadFails, elevated = { ok: true, canceled: false, code: 0 }, appearsAfter = true } = {}) {
  let isInstalled = installed
  const calls = []
  const disk = {}
  const eq = mod.createEqualizer({
    findConfigDir: async () => (isInstalled ? DIR : null),
    join: (...p) => p.join('\\'),
    readText: async (f) => disk[f] ?? '',
    writeText: async (f, text) => { disk[f] = text; return { ok: true } },
    settings: { get: () => undefined, set: () => true },
    tempDir: () => 'C:\\Temp',
    download: async (url, file) => { calls.push(['download', url, file]); if (downloadFails) throw new Error(downloadFails) },
    hashFile: async (file) => { calls.push(['hash', file]); return hash },
    removeFile: async (file) => { calls.push(['remove', file]) },
    runElevated: async (file, args) => { calls.push(['run', file, args]); if (elevated.ok && appearsAfter) isInstalled = true; return elevated },
  })
  return { eq, calls, disk }
}
const SETUP_FILE = `C:\\Temp\\${core.APO_SETUP.fileName}`

describe('equalizador (serviço): instalar o Equalizer APO', () => {
  it('baixa a versão fixa, confere o SHA-256, roda com /S como administrador e apaga o instalador', async () => {
    const { eq, calls } = setupInstall()
    const r = await eq.install()
    expect(r.ok).toBe(true)
    expect(calls).toEqual([
      ['download', core.APO_SETUP.url, SETUP_FILE],
      ['hash', SETUP_FILE],
      ['run', SETUP_FILE, ['/S']],
      ['remove', SETUP_FILE],
    ])
  })
  it('depois de instalar, já grava o ajuste salvo no APO (o config.txt padrão vira só o do Laaazy)', async () => {
    const { eq, disk } = setupInstall()
    await eq.install()
    expect(disk[MAIN]).toBe(`${core.INCLUDE_LINE}
`)
    expect(disk[APP]).toBe(core.render(core.FLAT))
  })
  it('a mensagem lembra dos passos com o mouse (saída de som e reiniciar)', async () => {
    expect((await setupInstall().eq.install()).msg).toMatch(/saída de som/)
  })
  it('já instalado: não baixa nada', async () => {
    const { eq, calls } = setupInstall({ installed: true })
    expect(await eq.install()).toEqual({ ok: true, msg: 'O Equalizer APO já está instalado.' })
    expect(calls).toEqual([])
  })
  it('download falhou: explica e não roda nada', async () => {
    const { eq, calls } = setupInstall({ downloadFails: 'sem internet' })
    const r = await eq.install()
    expect(r).toEqual({ ok: false, msg: 'Não consegui baixar o Equalizer APO: sem internet' })
    expect(calls.some((c) => c[0] === 'run')).toBe(false)
  })
  it('SHA-256 diferente: apaga o arquivo e NÃO roda (pode ter sido trocado no caminho)', async () => {
    const { eq, calls } = setupInstall({ hash: 'f'.repeat(64) })
    const r = await eq.install()
    expect(r.ok).toBe(false)
    expect(r.msg).toMatch(/não confere/)
    expect(calls.map((c) => c[0])).toEqual(['download', 'hash', 'remove'])
  })
  it('"Não" no aviso do Windows: avisa que nada foi instalado', async () => {
    const r = await setupInstall({ elevated: { ok: false, canceled: true, code: 1223 } }).eq.install()
    expect(r).toEqual({ ok: false, msg: 'Instalação cancelada no aviso do Windows. Nada foi instalado.' })
  })
  it('instalador terminou com erro: mostra o código', async () => {
    const r = await setupInstall({ elevated: { ok: false, canceled: false, code: 2 } }).eq.install()
    expect(r).toEqual({ ok: false, msg: 'O instalador do Equalizer APO terminou com erro (código 2).' })
  })
  it('instalador terminou, mas o APO não apareceu no registro: avisa', async () => {
    const r = await setupInstall({ appearsAfter: false }).eq.install()
    expect(r.ok).toBe(false)
    expect(r.msg).toMatch(/não apareceu/)
  })
  it('dois cliques em "Instalar" esperam a mesma instalação', async () => {
    const { eq, calls } = setupInstall()
    const [a, b] = await Promise.all([eq.install(), eq.install()])
    expect(a).toEqual(b)
    expect(calls.filter((c) => c[0] === 'download')).toHaveLength(1)
  })
})
