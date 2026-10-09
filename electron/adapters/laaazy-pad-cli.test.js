import { describe, it, expect, vi } from 'vitest'
import path from 'node:path'
import mod from './laaazy-pad-cli.js'

const DIR = 'C:\\P\\Laaazy-pad'
const EXE = path.join(DIR, 'LaaazyPad.exe')
const CMD = path.join(DIR, 'LaaazyPadCmd.exe')
const APPDATA = 'C:\\Users\\b\\AppData\\Roaming'

// execFile falso: responde por programa + argumentos, como o Node (erro com .code = código de saída)
function fakeExec(answers = {}) {
  return vi.fn((file, args, opts, cb) => {
    const key = [path.basename(file), ...args].join(' ')
    const a = answers[key] ?? { code: 0, out: '' }
    const err = a.code ? Object.assign(new Error('saiu com ' + a.code), { code: a.code }) : null
    cb(err, a.out ?? '', a.err ?? '')
  })
}

function make({ answers, dirs = {}, spawnError = false } = {}) {
  const execFile = fakeExec(answers)
  const readdir = vi.fn(async (d) => { if (!dirs[d]) throw new Error('ENOENT'); return dirs[d] })
  const child = { on: vi.fn((ev, fn) => { if (ev === (spawnError ? 'error' : 'spawn')) fn(new Error('negado')) ; return child }), unref: vi.fn() }
  const spawn = vi.fn(() => child)
  const openPath = vi.fn(async () => '')
  const cli = mod.createLaaazyPadCli({ execFile, spawn, readdir, openPath, env: { APPDATA } })
  return { cli, execFile, spawn, openPath, readdir }
}

describe('Laaazy-pad (LaaazyPadCmd.exe, docs/CONTRATO.md do Laaazy-pad)', () => {
  it('Query: devolve o perfil ativo, sem esperar antes (o DS4Windows pedia 700 ms)', async () => {
    const { cli, execFile } = make({ answers: { 'LaaazyPadCmd.exe -command Query.1.ProfileName': { out: 'PC\r\n' } } })
    expect(await cli.queryProfile(EXE)).toBe('PC')
    const [file, args, opts] = execFile.mock.calls[0]
    expect(file).toBe(CMD)
    expect(args).toEqual(['-command', 'Query.1.ProfileName'])
    expect(opts).toMatchObject({ cwd: DIR, windowsHide: true, encoding: 'utf8' })
  })
  it('Query com o Laaazy-pad fechado (código 1): sem perfil', async () => {
    const { cli } = make({ answers: { 'LaaazyPadCmd.exe -command Query.1.ProfileName': { code: 1, err: 'O Laaazy-pad não está aberto.' } } })
    expect(await cli.queryProfile(EXE)).toBeNull()
  })
  it('LoadProfile: código 0 = carregou ("" como no DS4Windows)', async () => {
    const { cli, execFile } = make()
    expect(await cli.loadProfile(EXE, 'PC')).toBe('')
    expect(execFile.mock.calls[0][1]).toEqual(['-command', 'LoadProfile.1.PC'])
  })
  it('LoadProfile com erro: devolve a mensagem em português do Laaazy-pad (UTF-8)', async () => {
    const { cli } = make({ answers: { 'LaaazyPadCmd.exe -command LoadProfile.1.Brunera': { code: 3, err: 'Perfil "Brunera" não existe. Perfis: Jogos, PC.\r\n' } } })
    expect(await cli.loadProfile(EXE, 'Brunera')).toBe('Perfil "Brunera" não existe. Perfis: Jogos, PC.')
  })
  it('erro sem mensagem: diz o código', async () => {
    const { cli } = make({ answers: { 'LaaazyPadCmd.exe -command LoadProfile.1.PC': { code: 4 } } })
    expect(await cli.loadProfile(EXE, 'PC')).toMatch(/código 4/)
  })
  it('shutdown pelo comando oficial; sem exe, nada', async () => {
    const { cli, execFile } = make()
    expect(await cli.shutdown(EXE)).toBe('')
    expect(execFile.mock.calls[0][1]).toEqual(['-command', 'shutdown'])
    expect(await cli.shutdown(null)).toBe('')
  })
  it('perfis *.json da pasta Profiles ao lado do exe (modo portátil), em ordem', async () => {
    const { cli } = make({ dirs: { [path.join(DIR, 'Profiles')]: ['PC.json', 'Jogos.json', 'leia.txt'] } })
    expect(await cli.listProfiles(EXE)).toEqual({ dir: path.join(DIR, 'Profiles'), profiles: ['Jogos', 'PC'] })
  })
  it('sem a pasta ao lado: usa %APPDATA%\\Laaazy-pad\\Profiles', async () => {
    const d = path.join(APPDATA, 'Laaazy-pad', 'Profiles')
    const { cli } = make({ dirs: { [d]: ['Jogos.json', 'PC.json'] } })
    expect(await cli.listProfiles(EXE)).toEqual({ dir: d, profiles: ['Jogos', 'PC'] })
  })
  it('nenhuma pasta de perfis: lista vazia', async () => {
    expect(await make().cli.listProfiles(EXE)).toEqual({ dir: null, profiles: [] })
  })
  it('está aberto? procura o processo LaaazyPad.exe', async () => {
    const { cli, execFile } = make({ answers: { 'tasklist /FI IMAGENAME eq LaaazyPad.exe /NH': { out: 'LaaazyPad.exe   123 Console 1 50.000 K' } } })
    expect(await cli.isRunning()).toBe(true)
    expect(execFile.mock.calls[0][1]).toEqual(['/FI', 'IMAGENAME eq LaaazyPad.exe', '/NH'])
    const fechado = make({ answers: { 'tasklist /FI IMAGENAME eq LaaazyPad.exe /NH': { out: 'INFORMAÇÕES: nenhuma tarefa' } } })
    expect(await fechado.cli.isRunning()).toBe(false)
  })
  it('abrir: LaaazyPad.exe -m em segundo plano; se o Windows recusar, abre pelo Windows', async () => {
    const { cli, spawn } = make()
    expect(await cli.start(EXE)).toBe('')
    expect(spawn).toHaveBeenCalledWith(EXE, ['-m'], expect.objectContaining({ cwd: DIR, detached: true, stdio: 'ignore' }))
    const recusado = make({ spawnError: true })
    await recusado.cli.start(EXE)
    expect(recusado.openPath).toHaveBeenCalledWith(EXE)
  })
  it('fechar à força: taskkill do LaaazyPad.exe', async () => {
    const { cli, execFile } = make()
    await cli.kill()
    expect(execFile.mock.calls[0].slice(0, 2)).toEqual(['taskkill', ['/IM', 'LaaazyPad.exe', '/T', '/F']])
  })
  it('nome do programa de comandos (sempre vem junto)', () => {
    expect(make().cli.cmdName(EXE)).toBe('LaaazyPadCmd.exe')
    expect(make().cli.cmdName(null)).toBe('')
  })
})
