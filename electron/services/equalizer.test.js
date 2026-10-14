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
    expect((await eq.status()).error).toMatch(/permissão/)
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
