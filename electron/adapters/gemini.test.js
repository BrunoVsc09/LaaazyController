import { describe, it, expect, vi } from 'vitest'
import mod from './gemini.js'

const ok = (text, finishReason = 'STOP') => ({ candidates: [{ content: { parts: [{ text }] }, finishReason }] })
const fakeFetch = (status = 200, body = {}) =>
  vi.fn(async () => ({ ok: status >= 200 && status < 300, status, json: async () => body }))

describe('Gemini adapter', () => {
  it('chama generateContent do modelo com a chave no cabeçalho, instrução do sistema e JSON obrigatório', async () => {
    const fetch = fakeFetch(200, ok('{"a":1}'))
    const g = mod.createGemini({ fetch })
    expect(await g.generate('KEY', 'gemini-3.8-flash', { system: 'SYS', user: 'comédia', schema: { type: 'OBJECT' } })).toBe('{"a":1}')
    const [url, opts] = fetch.mock.calls[0]
    expect(url).toBe('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent')
    expect(opts.method).toBe('POST')
    expect(opts.headers['x-goog-api-key']).toBe('KEY')
    expect(url).not.toContain('KEY')
    const body = JSON.parse(opts.body)
    expect(body.systemInstruction.parts[0].text).toBe('SYS')
    expect(body.contents).toEqual([{ role: 'user', parts: [{ text: 'comédia' }] }])
    expect(body.generationConfig).toMatchObject({ responseMimeType: 'application/json', responseSchema: { type: 'OBJECT' } })
  })
  it('nome de modelo estranho não vira URL', async () => {
    const fetch = fakeFetch(200, ok('{}'))
    await expect(mod.createGemini({ fetch }).generate('K', '../../evil', { system: '', user: 'x', schema: {} })).rejects.toThrow(/Modelo inválido/)
    expect(fetch).not.toHaveBeenCalled()
  })
  it('resposta bloqueada ou cortada vira erro', async () => {
    await expect(mod.createGemini({ fetch: fakeFetch(200, { promptFeedback: { blockReason: 'SAFETY' } }) }).generate('K', 'm', { system: '', user: 'x', schema: {} }))
      .rejects.toThrow(/bloqueou/)
    await expect(mod.createGemini({ fetch: fakeFetch(200, ok('{"a"', 'MAX_TOKENS')) }).generate('K', 'm', { system: '', user: 'x', schema: {} }))
      .rejects.toThrow(/incompleta/)
  })
  it('erros HTTP com mensagem clara', async () => {
    const call = (s) => mod.createGemini({ fetch: fakeFetch(s) }).generate('K', 'm', { system: '', user: 'x', schema: {} })
    await expect(call(429)).rejects.toThrow(/limite/)
    await expect(call(403)).rejects.toThrow(/recusou a chave/)
    await expect(call(404)).rejects.toThrow(/Modelo não encontrado/)
    await expect(call(500)).rejects.toThrow(/500/)
  })
  it('ping confere se a chave enxerga o modelo', async () => {
    expect(await mod.createGemini({ fetch: fakeFetch(200, { name: 'models/m' }) }).ping('K', 'm')).toBe(true)
    expect(await mod.createGemini({ fetch: fakeFetch(400) }).ping('K', 'm')).toBe(false)
  })
})
