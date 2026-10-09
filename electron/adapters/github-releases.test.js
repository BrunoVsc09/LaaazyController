import { describe, it, expect, afterAll } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import crypto from 'node:crypto'
import mod from './github-releases.js'

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lz-update-'))
afterAll(() => fs.rmSync(dir, { recursive: true, force: true }))

// fetch falso: devolve o corpo pedido (nunca vai à internet)
const fakeFetch = (body, status = 200) => async () => new Response(body, { status })

describe('github-releases (adaptador)', () => {
  it('fetchJson lê a resposta; erro HTTP vira exceção', async () => {
    expect(await mod.createGithubReleases({ fetch: fakeFetch('{"tag_name":"v1.0.0"}') }).fetchJson('https://x')).toEqual({ tag_name: 'v1.0.0' })
    await expect(mod.createGithubReleases({ fetch: fakeFetch('', 404) }).fetchJson('https://x')).rejects.toThrow('O GitHub respondeu com erro 404.')
  })
  it('download grava o arquivo; hashFile dá o SHA-256 dele', async () => {
    const data = Buffer.from('instalador de mentira')
    const gh = mod.createGithubReleases({ fetch: fakeFetch(data) })
    const file = path.join(dir, 'setup.exe')
    await gh.download('https://x', file)
    expect(fs.readFileSync(file)).toEqual(data)
    expect(await gh.hashFile(file)).toBe(crypto.createHash('sha256').update(data).digest('hex'))
  })
  it('download com erro HTTP não deixa arquivo pela metade', async () => {
    const file = path.join(dir, 'falhou.exe')
    await expect(mod.createGithubReleases({ fetch: fakeFetch('', 500) }).download('https://x', file)).rejects.toThrow('erro 500')
    expect(fs.existsSync(file)).toBe(false)
  })
  it('o instalador roda em silêncio e abre o Laaazy no fim (argumentos do instalador NSIS)', () => {
    expect(mod.INSTALLER_ARGS).toEqual(['/S', '--updated', '--force-run'])
  })
})
