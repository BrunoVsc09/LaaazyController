import { describe, it, expect } from 'vitest'
import mod from './audio-outputs.js'

// Saída de som preferida (Configurações → Som, pedido do Bruno 2026-10-14): lista curta com setinha;
// a saída marcada vira a preferida e o Laaazy manda o som para ela ao abrir, se estiver conectada
const XDG = { id: '{0.0.0.00000000}.{aaa}', name: 'Fones de ouvido (XDG-342)', isDefault: false }
const PC = { id: '{0.0.0.00000000}.{bbb}', name: 'Alto-falantes (High Definition Audio Device)', isDefault: true }
const TV = { id: '{0.0.0.00000000}.{ccc}', name: 'Odyssey G30B (NVIDIA High Definition Audio)', isDefault: false }
const HANDS = { id: '{0.0.0.00000000}.{ddd}', name: 'Headset (XDG-342 Hands-Free)', isDefault: false }
const STEAM = { id: '{0.0.0.00000000}.{eee}', name: 'Alto-falantes (Steam Streaming Speakers)', isDefault: false }
const VM = { id: '{0.0.0.00000000}.{fff}', name: 'Voicemeeter Input (VB-Audio Voicemeeter VAIO)', isDefault: false }

describe('saídas de som: ler a lista do Windows', () => {
  it('uma saída por linha: id, nome e se é a padrão, separados por tab', () => {
    const text = `${XDG.id}\t${XDG.name}\t0\r\n${PC.id}\t${PC.name}\t1\r\n`
    expect(mod.parseOutputs(text)).toEqual([XDG, PC])
  })
  it('ignora linhas quebradas ou vazias', () => {
    expect(mod.parseOutputs(`lixo\n\n${XDG.id}\t${XDG.name}\t0\n\t\t1`)).toEqual([XDG])
  })
})

describe('saídas de som: lista curta', () => {
  const all = [XDG, PC, TV, HANDS, STEAM, VM]
  it('esconde o modo telefone do Bluetooth (Hands-Free), a Steam e as saídas virtuais', () => {
    expect(mod.visibleOutputs(all).items.map((o) => o.name)).toEqual([PC.name, XDG.name, TV.name])
  })
  it('diz quantas ficaram escondidas (para o "Mostrar todas")', () => {
    expect(mod.visibleOutputs(all).hidden).toBe(3)
  })
  it('"Mostrar todas": tudo, em ordem alfabética', () => {
    const r = mod.visibleOutputs(all, { all: true })
    expect(r.items).toHaveLength(6)
    expect(r.hidden).toBe(0)
    expect(r.items[0].name).toBe(PC.name)
  })
  it('a saída preferida aparece mesmo se o filtro fosse escondê-la (a pessoa escolheu)', () => {
    expect(mod.visibleOutputs(all, { preferredId: VM.id }).items.map((o) => o.id)).toContain(VM.id)
  })
})

describe('saídas de som: trocar para a preferida ao abrir o Laaazy', () => {
  it('preferida conectada e não é a padrão: troca para ela', () => {
    expect(mod.pickPreferred([XDG, PC], { id: XDG.id, name: XDG.name })).toBe(XDG)
  })
  it('já é a padrão: não precisa trocar', () => {
    expect(mod.pickPreferred([{ ...XDG, isDefault: true }, { ...PC, isDefault: false }], { id: XDG.id, name: XDG.name })).toBe(null)
  })
  it('caixinha desligada (não está na lista): não troca nada', () => {
    expect(mod.pickPreferred([PC, TV], { id: XDG.id, name: XDG.name })).toBe(null)
  })
  it('o Windows trocou o id (pareou de novo): acha pelo nome', () => {
    const renamed = { ...XDG, id: '{0.0.0.00000000}.{novo}' }
    expect(mod.pickPreferred([renamed, PC], { id: XDG.id, name: XDG.name })).toBe(renamed)
  })
  it('sem preferida: não troca', () => {
    expect(mod.pickPreferred([XDG, PC], null)).toBe(null)
  })
})

describe('saídas de som: o que pode ser salvo como preferida', () => {
  it('nenhuma (null) ou { id, name } em texto', () => {
    expect(mod.validPreferred(null)).toBe(true)
    expect(mod.validPreferred({ id: XDG.id, name: XDG.name })).toBe(true)
  })
  it.each([
    ['texto solto', 'XDG'],
    ['sem nome', { id: XDG.id }],
    ['id vazio', { id: '', name: 'x' }],
    ['id gigante', { id: 'x'.repeat(301), name: 'x' }],
    ['campo a mais', { id: XDG.id, name: XDG.name, cmd: 'rm' }],
  ])('recusa %s', (_n, v) => {
    expect(mod.validPreferred(v)).toBe(false)
  })
})
