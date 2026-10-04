import { describe, it, expect, beforeEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import store from './json-store.js'

const { readJson, readJsonSync, writeJson, writeJsonSync, takeWarnings } = store

let dir
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lazy-store-'))
  takeWarnings()
})

const variants = [
  ['assíncrono', readJson, writeJson],
  ['síncrono', readJsonSync, writeJsonSync],
]

describe.each(variants)('json-store (%s)', (_name, read, write) => {
  it('arquivo ausente devolve o padrão sem aviso', async () => {
    expect(await read(path.join(dir, 'nao-existe.json'), { a: 1 })).toEqual({ a: 1 })
    expect(takeWarnings()).toEqual([])
  })

  it('lê o que foi gravado', async () => {
    const f = path.join(dir, 'sub', 'x.json')
    expect(await write(f, { edgePath: 'C:\Edge' })).toBe(true)
    expect(await read(f, {})).toEqual({ edgePath: 'C:\Edge' })
  })

  it('JSON corrompido: guarda .bak, avisa e devolve o padrão', async () => {
    const f = path.join(dir, 'x.json')
    fs.writeFileSync(f, '{"quebrado":')
    expect(await read(f, [])).toEqual([])
    expect(fs.readFileSync(f + '.bak', 'utf8')).toBe('{"quebrado":')
    expect(takeWarnings()[0].msg).toMatch(/corrompido/)
  })

  it('tipo errado (objeto onde se espera lista) conta como corrompido', async () => {
    const f = path.join(dir, 'x.json')
    fs.writeFileSync(f, '{"a":1}')
    expect(await read(f, [])).toEqual([])
    expect(fs.existsSync(f + '.bak')).toBe(true)
  })

  it('null e valores soltos contam como corrompido', async () => {
    const f = path.join(dir, 'x.json')
    fs.writeFileSync(f, 'null')
    expect(await read(f, {})).toEqual({})
    fs.writeFileSync(f, '42')
    expect(await read(f, {})).toEqual({})
  })

  it('gravação não deixa .tmp para trás', async () => {
    const f = path.join(dir, 'x.json')
    await write(f, [1, 2])
    expect(fs.existsSync(f + '.tmp')).toBe(false)
  })

  it('falha ao gravar devolve false, avisa e limpa o .tmp', async () => {
    const f = path.join(dir, 'pasta')
    fs.mkdirSync(f) // renomear um arquivo por cima de uma pasta falha
    expect(await write(f, { a: 1 })).toBe(false)
    expect(fs.existsSync(f + '.tmp')).toBe(false)
    expect(takeWarnings()[0].msg).toMatch(/Não consegui salvar/)
  })
})

it('takeWarnings esvazia a lista', async () => {
  const f = path.join(dir, 'x.json')
  fs.writeFileSync(f, 'x')
  await readJson(f, {})
  expect(takeWarnings()).toHaveLength(1)
  expect(takeWarnings()).toHaveLength(0)
})
