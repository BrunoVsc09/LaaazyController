import { describe, it, expect, beforeEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import sources from './game-sources.js'

let dir
const file = (rel, content = '') => {
  const p = path.join(dir, rel)
  fs.mkdirSync(path.dirname(p), { recursive: true })
  fs.writeFileSync(p, content)
  return p
}
beforeEach(() => { dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lazy-games-')) })

describe('bestExe', () => {
  it('escolhe o maior .exe que não seja instalador', async () => {
    file('Jogo/setup.exe', 'x'.repeat(500))
    file('Jogo/pequeno.exe', 'x'.repeat(10))
    const big = file('Jogo/bin/Jogo.exe', 'x'.repeat(100))
    expect(await sources.bestExe(path.join(dir, 'Jogo'))).toBe(big)
  })
  it('não entra em pastas de redistribuíveis', async () => {
    file('Jogo/_Redist/vc.exe', 'x'.repeat(999))
    const exe = file('Jogo/Jogo.exe', 'x')
    expect(await sources.bestExe(path.join(dir, 'Jogo'))).toBe(exe)
  })
  it('pasta sem .exe devolve null', async () => {
    file('Vazio/readme.txt')
    expect(await sources.bestExe(path.join(dir, 'Vazio'))).toBeNull()
  })
})

describe('scanFolder', () => {
  it('pasta que já é um jogo vira um jogo só', async () => {
    const exe = file('Hades/Hades.exe', 'x')
    expect(await sources.scanFolder(path.join(dir, 'Hades'))).toEqual([{ name: 'Hades', exe }])
  })
  it('pasta de jogos: cada subpasta com .exe vira um jogo', async () => {
    const a = file('Jogos/A/a.exe', 'x')
    const b = file('Jogos/B/bin/b.exe', 'x')
    file('Jogos/C/leia.txt')
    expect(await sources.scanFolder(path.join(dir, 'Jogos'))).toEqual([{ name: 'A', exe: a }, { name: 'B', exe: b }])
  })
  it('pasta inexistente devolve lista vazia', async () => {
    expect(await sources.scanFolder(path.join(dir, 'nada'))).toEqual([])
  })
})

describe('scanSteam', () => {
  it('lê os manifestos de todas as bibliotecas', async () => {
    const root = path.join(dir, 'Steam')
    const lib2 = path.join(dir, 'Lib2')
    file('Steam/steamapps/libraryfolders.vdf', `"path" "${lib2.replace(/\\/g, '\\\\')}"`)
    file('Steam/steamapps/appmanifest_1.acf', '"appid" "1" "name" "Um"')
    file('Lib2/steamapps/appmanifest_2.acf', '"appid" "2" "name" "Dois"')
    file('Lib2/steamapps/quebrado.acf', 'x')
    const games = await sources.scanSteam({ steamRoot: async () => root })
    expect(games.map((g) => g.id).sort()).toEqual(['steam:1', 'steam:2'])
  })
  it('sem Steam devolve lista vazia', async () => {
    expect(await sources.scanSteam({ steamRoot: async () => null })).toEqual([])
  })
})

describe('scanEpic', () => {
  it('lê os .item válidos e ignora os quebrados', async () => {
    file('M/a.item', JSON.stringify({ DisplayName: 'Jogo', AppName: 'J', CatalogNamespace: 'n', CatalogItemId: 'i' }))
    file('M/b.item', '{quebrado')
    file('M/c.txt', '{}')
    const games = await sources.scanEpic(path.join(dir, 'M'))
    expect(games.map((g) => g.id)).toEqual(['epic:J'])
  })
  it('sem pasta de manifestos devolve lista vazia', async () => {
    expect(await sources.scanEpic(path.join(dir, 'nada'))).toEqual([])
  })
})
