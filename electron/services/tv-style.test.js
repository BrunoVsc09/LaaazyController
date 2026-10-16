import { describe, it, expect, vi } from 'vitest'
import mod from './tv-style.js'

function make(size = 'grande', fails = false, youtubeTv = false) {
  const writeFiles = vi.fn(async () => { if (fails) throw new Error('disco cheio') })
  return { s: mod.createTvStyle({ size: () => size, youtubeTv: () => youtubeTv, dir: 'C:\\data\\edge-ext', writeFiles }), writeFiles }
}

describe('tv-style: YouTube com tela de TV (serviço)', () => {
  it('ligado: a extensão leva a parte do YouTube, mesmo com a legenda "Do site"', async () => {
    const { s, writeFiles } = make('site', false, true)
    expect(await s.prepare()).toBe('C:\\data\\edge-ext')
    expect(Object.keys(writeFiles.mock.calls[0][1])).toContain('youtube-tv.js')
  })
})

describe('tv-style: extensão da legenda grande (serviço)', () => {
  it('grava a extensão do tamanho escolhido e devolve a pasta para o Edge carregar', async () => {
    const { s, writeFiles } = make('grande')
    expect(await s.prepare()).toBe('C:\\data\\edge-ext')
    const [dir, files] = writeFiles.mock.calls[0]
    expect(dir).toBe('C:\\data\\edge-ext')
    expect(files['tv.css']).toMatch(/8vh/)
  })
  it('"Do site": não grava nada e o Edge abre sem extensão', async () => {
    const { s, writeFiles } = make('site')
    expect(await s.prepare()).toBeNull()
    expect(writeFiles).not.toHaveBeenCalled()
  })
  it('não conseguiu gravar: o Edge abre do mesmo jeito, sem a extensão', async () => {
    expect(await make('grande', true).s.prepare()).toBeNull()
  })
})
