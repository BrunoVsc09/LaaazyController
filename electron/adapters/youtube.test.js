import { describe, it, expect, vi } from 'vitest'
import mod from './youtube.js'

const reply = (status, body = {}) => ({ ok: status >= 200 && status < 300, status, json: async () => body })

describe('youtube.search', () => {
  it('busca vídeos que podem ser embutidos, no Brasil e em português; a chave vai só no cabeçalho', async () => {
    const fetch = vi.fn(async () => reply(200, { items: [{ id: { videoId: 'a' } }] }))
    const yt = mod.createYoutube({ fetch })
    expect(await yt.search('AIzaKEY', 'Dark trailer dublado')).toEqual([{ id: { videoId: 'a' } }])
    const [url, opts] = fetch.mock.calls[0]
    const u = new URL(url)
    expect(u.origin + u.pathname).toBe('https://www.googleapis.com/youtube/v3/search')
    expect(Object.fromEntries(u.searchParams)).toEqual({
      part: 'snippet', type: 'video', videoEmbeddable: 'true', maxResults: '8', regionCode: 'BR', relevanceLanguage: 'pt', q: 'Dark trailer dublado',
    })
    expect(url).not.toContain('AIzaKEY')
    expect(opts.headers['x-goog-api-key']).toBe('AIzaKEY')
  })
  it('cota do dia acabou: erro com code "quota"', async () => {
    const yt = mod.createYoutube({ fetch: async () => reply(403, { error: { errors: [{ reason: 'quotaExceeded' }] } }) })
    await expect(yt.search('K', 'q')).rejects.toMatchObject({ code: 'quota' })
  })
  it('chave recusada ou outro erro: mensagem clara', async () => {
    const yt = mod.createYoutube({ fetch: async () => reply(400, { error: { errors: [{ reason: 'keyInvalid' }] } }) })
    await expect(yt.search('K', 'q')).rejects.toThrow(/YouTube recusou/)
    const off = mod.createYoutube({ fetch: async () => { throw new Error('offline') } })
    await expect(off.search('K', 'q')).rejects.toThrow(/Sem conexão/)
  })
})

describe('youtube.ping', () => {
  it('testa a chave com a consulta mais barata (1 unidade da cota)', async () => {
    const fetch = vi.fn(async () => reply(200, { items: [] }))
    expect(await mod.createYoutube({ fetch }).ping('K')).toBe(true)
    const u = new URL(fetch.mock.calls[0][0])
    expect(u.pathname).toBe('/youtube/v3/videos')
    expect(u.searchParams.get('part')).toBe('id')
  })
  it('chave recusada ou sem internet: false', async () => {
    expect(await mod.createYoutube({ fetch: async () => reply(400) }).ping('K')).toBe(false)
    expect(await mod.createYoutube({ fetch: async () => { throw new Error('x') } }).ping('K')).toBe(false)
  })
})
