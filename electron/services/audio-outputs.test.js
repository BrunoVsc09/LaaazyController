import { describe, it, expect } from 'vitest'
import mod from './audio-outputs.js'

const XDG = { id: '{0.0.0.00000000}.{aaa}', name: 'Fones de ouvido (XDG-342)' }
const PC = { id: '{0.0.0.00000000}.{bbb}', name: 'Alto-falantes (High Definition Audio Device)' }
const VM = { id: '{0.0.0.00000000}.{ccc}', name: 'Voicemeeter Input (VB-Audio Voicemeeter VAIO)' }
const line = (o, isDefault) => `${o.id}\t${o.name}\t${isDefault ? 1 : 0}`

// Windows falso: lista de saídas (a primeira de defaultIndex é a padrão) e trocas pedidas
function setup({ devices = [XDG, PC, VM], defaultId = PC.id, saved, listFails, setFails } = {}) {
  let current = defaultId
  const sets = []
  const store = saved === undefined ? {} : { audioOutput: saved }
  const svc = mod.createAudioOutputs({
    listOutputs: async () => (listFails ? { ok: false, code: 1 } : { ok: true, text: devices.map((o) => line(o, o.id === current)).join('\r\n') }),
    setDefaultOutput: async (id) => { sets.push(id); if (setFails) return { ok: false, code: setFails }; current = id; return { ok: true } },
    settings: { get: (k) => store[k], set: (k, v) => { store[k] = v; return true } },
  })
  return { svc, sets, store, current: () => current }
}

describe('saídas de som (serviço): lista', () => {
  it('lista curta, com a padrão e a preferida marcadas, e quantas ficaram escondidas', async () => {
    const r = await setup({ saved: { id: XDG.id, name: XDG.name } }).svc.outputs()
    expect(r).toEqual({
      ok: true,
      hidden: 1,
      items: [
        { ...PC, isDefault: true, preferred: false },
        { ...XDG, isDefault: false, preferred: true },
      ],
    })
  })
  it('"Mostrar todas"', async () => {
    expect((await setup().svc.outputs({ all: true })).items).toHaveLength(3)
  })
  it('não conseguiu ler as saídas do Windows: avisa, sem quebrar a tela', async () => {
    const r = await setup({ listFails: true }).svc.outputs()
    expect(r.ok).toBe(false)
    expect(r.items).toEqual([])
    expect(r.msg).toMatch(/saídas de som/)
  })
})

describe('saídas de som (serviço): escolher na lista', () => {
  it('troca a saída do Windows e guarda como preferida', async () => {
    const { svc, sets, store, current } = setup()
    const r = await svc.choose(XDG.id)
    expect(r.ok).toBe(true)
    expect(r.msg).toMatch(/XDG-342/)
    expect(sets).toEqual([XDG.id])
    expect(current()).toBe(XDG.id)
    expect(store.audioOutput).toEqual({ id: XDG.id, name: XDG.name })
  })
  it('saída que não está mais conectada: não troca nem guarda', async () => {
    const { svc, sets, store } = setup({ devices: [PC] })
    expect(await svc.choose(XDG.id)).toEqual({ ok: false, msg: 'Essa saída de som não está mais conectada.' })
    expect(sets).toEqual([])
    expect(store.audioOutput).toBeUndefined()
  })
  it('o Windows recusou a troca: explica e não guarda como preferida', async () => {
    const { svc, store } = setup({ setFails: 5 })
    const r = await svc.choose(XDG.id)
    expect(r.ok).toBe(false)
    expect(r.msg).toMatch(/código 5/)
    expect(store.audioOutput).toBeUndefined()
  })
})

describe('saídas de som (serviço): ao abrir o Laaazy', () => {
  it('preferida conectada: o som vai para ela', async () => {
    const { svc, sets } = setup({ saved: { id: XDG.id, name: XDG.name } })
    await svc.start()
    expect(sets).toEqual([XDG.id])
  })
  it('preferida já é a padrão: não mexe', async () => {
    const { svc, sets } = setup({ saved: { id: XDG.id, name: XDG.name }, defaultId: XDG.id })
    await svc.start()
    expect(sets).toEqual([])
  })
  it('caixinha desligada: não mexe', async () => {
    const { svc, sets } = setup({ devices: [PC], saved: { id: XDG.id, name: XDG.name } })
    await svc.start()
    expect(sets).toEqual([])
  })
  it('sem preferida (ou valor estragado no settings.json): não mexe', async () => {
    for (const saved of [undefined, null, 'XDG']) {
      const { svc, sets } = setup({ saved })
      await svc.start()
      expect(sets).toEqual([])
    }
  })
})
