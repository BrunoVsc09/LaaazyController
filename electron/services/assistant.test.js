import { describe, it, expect, vi } from 'vitest'
import mod from './assistant.js'

const DAY = 24 * 3600 * 1000
const answer = (over = {}) => JSON.stringify({
  kind: 'movie', genres: ['comedia'], exclude_genres: [], services: [], max_runtime_minutes: 100,
  min_year: null, max_year: null, min_rating: null, similar_to: null, explanation: 'Comédia curta.', off_topic: false, ...over,
})

function make({ geminiKey = 'G', tmdbKey = 'T', reply = answer(), usage = null, t = 10 * DAY } = {}) {
  let stored = usage
  let now = t
  const keys = { gemini: geminiKey, tmdb: tmdbKey }
  const gemini = { generate: vi.fn(async () => { if (reply instanceof Error) throw reply; return reply }), ping: vi.fn(async () => true) }
  const tmdb = {
    providers: vi.fn(async () => [{ provider_id: 8, provider_name: 'Netflix' }, { provider_id: 119, provider_name: 'Amazon Prime Video' }]),
    discoverWith: vi.fn(async (_k, kind) => [{ id: 1, title: 'Filme A', name: 'Série A', popularity: 5 }, { id: 2, title: 'Filme B', name: 'Série B', popularity: 9 }]),
    search: vi.fn(async () => [{ id: 50, media_type: 'movie', title: 'Duna', popularity: 1 }]),
    recommendations: vi.fn(async () => [{ id: 60, title: 'Parecido', name: 'Parecido', popularity: 3 }]),
  }
  const catalog = { search: vi.fn(async () => ({ ok: true, items: [{ id: 'movie:9', title: 'Busca normal' }] })) }
  const secrets = { get: (n) => keys[n] || '', set: vi.fn((n, v) => { keys[n] = v; return true }), clear: vi.fn((n) => { keys[n] = '' }) }
  const a = mod.createAssistant({
    gemini, tmdb, catalog, secrets,
    model: () => 'gemini-3.8-flash',
    readUsage: async () => stored, writeUsage: async (u) => { stored = u; return true },
    now: () => now,
  })
  return { a, gemini, tmdb, catalog, secrets, usage: () => stored, advance: (ms) => { now += ms } }
}

// "Pedir à IA" saiu da Busca (2026-10-05): o Gemini fica só no "Parecido com este" (△)
const mood = JSON.stringify({ mood: 'suspense frio', picks: [{ title: 'Prisoners', year: 2013, kind: 'movie' }] })
const title = (n) => ({ id: `movie:${n}`, title: `Filme ${n}`, kind: 'Filme', year: '2020', overview: '' })

describe('assistant: sem "Pedir à IA"', () => {
  it('não existe mais o pedido livre pela busca', () => {
    expect(make().a.ask).toBeUndefined()
  })
})

describe('assistant: limite diário e modelo reserva', () => {
  it('no máximo 50 pedidos por dia; depois disso usa só o TMDB; no dia seguinte zera', async () => {
    const { a, gemini, usage, advance } = make({ reply: mood, usage: { day: 10, count: 49 } })
    expect(await a.similarMood(title(1))).toMatchObject({ ai: true })
    expect(usage()).toEqual({ day: 10, count: 50 })
    expect(await a.similarMood(title(2))).toMatchObject({ ai: false })
    expect(gemini.generate).toHaveBeenCalledTimes(1)
    advance(DAY)
    expect(await a.similarMood(title(3))).toMatchObject({ ai: true })
    expect(usage()).toEqual({ day: 11, count: 1 })
  })
  it('modelo sobrecarregado: tenta uma vez com o modelo reserva (gemini-flash-latest)', async () => {
    const { a, gemini } = make({ reply: mood })
    gemini.generate.mockRejectedValueOnce(Object.assign(new Error('sobrecarregado'), { code: 'overloaded' }))
    expect(await a.similarMood(title(1))).toMatchObject({ ai: true })
    expect(gemini.generate.mock.calls.map((c) => c[1])).toEqual(['gemini-3.8-flash', 'gemini-flash-latest'])
  })
  it('status mostra quantos pedidos restam hoje', async () => {
    expect(await make({ usage: { day: 10, count: 12 } }).a.status()).toEqual({ configured: true, model: 'gemini-3.8-flash', left: 38 })
  })
})

describe('assistant: chave', () => {
  it('testa a chave com o modelo antes de salvar', async () => {
    const { a, gemini, secrets } = make({ geminiKey: '' })
    gemini.ping.mockResolvedValue(false)
    expect((await a.setKey('X')).ok).toBe(false)
    expect(secrets.set).not.toHaveBeenCalled()
    gemini.ping.mockResolvedValue(true)
    expect((await a.setKey(' BO	A ')).ok).toBe(true)
    expect(secrets.set).toHaveBeenCalledWith('gemini', 'BOA')
  })
})

describe('assistant.similarMood ("Parecido com este" pelo △)', () => {
  const dark = { id: 'tv:70523', title: 'Dark', kind: 'Série', year: '2017', overview: 'Uma criança some.' }
  const moodReply = JSON.stringify({
    mood: 'suspense lento e frio',
    picks: [{ title: 'Prisoners', year: 2013, kind: 'movie' }, { title: 'Inventado', year: 2020, kind: 'tv' }, { title: 'Dark', year: 2017, kind: 'tv' }],
  })
  const searchFake = async (_k, q) => ({
    Prisoners: [{ id: 146233, media_type: 'movie', title: 'Os Suspeitos', release_date: '2013-09-19', popularity: 4 }],
    Dark: [{ id: 70523, media_type: 'tv', name: 'Dark', first_air_date: '2017-12-01', popularity: 9 }],
  }[q] || [])

  it('IA dá o clima e os títulos; só entram os que existem no TMDB, sem o próprio título', async () => {
    const { a, tmdb, gemini, usage } = make({ reply: moodReply })
    tmdb.search.mockImplementation(searchFake)
    const r = await a.similarMood(dark)
    expect(r).toMatchObject({ ok: true, ai: true, mood: 'suspense lento e frio' })
    expect(r.items.map((x) => x.id)).toEqual(['movie:146233', 'tv:60']) // completa com recomendações do TMDB
    expect(gemini.generate.mock.calls[0][2].user).toBe('Dark (Série, 2017)\nSinopse: Uma criança some.')
    expect(usage().count).toBe(1)
  })
  it('mesmo título de novo: usa o que já achou, sem gastar outro pedido', async () => {
    const { a, tmdb, gemini } = make({ reply: moodReply })
    tmdb.search.mockImplementation(searchFake)
    await a.similarMood(dark); await a.similarMood(dark)
    expect(gemini.generate).toHaveBeenCalledTimes(1)
  })
  it('sem chave do Gemini: parecidos pelas recomendações do TMDB', async () => {
    const { a, tmdb, gemini } = make({ geminiKey: '' })
    const r = await a.similarMood(dark)
    expect(gemini.generate).not.toHaveBeenCalled()
    expect(tmdb.recommendations).toHaveBeenCalledWith('T', 'tv', 70523)
    expect(r).toMatchObject({ ok: true, ai: false, mood: '', items: [{ title: 'Parecido' }] })
  })
  it('limite do dia ou erro da IA: também cai nas recomendações e não conta pedido com erro', async () => {
    const { a, usage } = make({ reply: new Error('caiu') })
    expect(await a.similarMood(dark)).toMatchObject({ ok: true, ai: false })
    expect(usage()).toBeNull()
    const cheio = make({ usage: { day: 10, count: 50 } })
    expect(await cheio.a.similarMood(dark)).toMatchObject({ ok: true, ai: false })
    expect(cheio.gemini.generate).not.toHaveBeenCalled()
  })
  it('sem chave do TMDB ou título inválido: avisa', async () => {
    expect(await make({ tmdbKey: '' }).a.similarMood(dark)).toMatchObject({ ok: false, items: [] })
    expect(await make().a.similarMood({ id: 'x', title: '' })).toMatchObject({ ok: false, items: [] })
  })
})
