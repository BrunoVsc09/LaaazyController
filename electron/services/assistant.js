// "Pedir à IA": o Gemini entende o pedido, o TMDB acha os títulos de verdade.
// Limite de 50 pedidos por dia (protege a cota da chave); erro da IA cai na busca normal.
const ai = require('../core/ai-filters')
const aiMood = require('../core/ai-mood')
const { resolveProviders, toItem, searchItems, parseItemId } = require('../core/catalog')
const { cleanKey } = require('../core/keys')

const LIMIT = 50
const FALLBACK_MODEL = 'gemini-flash-latest' // reserva quando o modelo escolhido está sobrecarregado
const DAY = 24 * 3600 * 1000
const MAX_ITEMS = 20
const MOOD_MIN = 6 // fileira do "Parecido com este" completa com recomendações do TMDB até aqui

function createAssistant({ gemini, tmdb, catalog, secrets, model, readUsage, writeUsage, now = Date.now }) {
  const today = () => Math.floor(now() / DAY)
  async function usedToday() {
    const u = await readUsage()
    return u && u.day === today() ? u.count : 0
  }

  async function status() {
    return { configured: !!secrets.get('gemini'), model: model(), left: LIMIT - (await usedToday()) }
  }

  async function setKey(raw) {
    const key = cleanKey(raw)
    if (!key) return { ok: false, msg: 'Cole a chave do Gemini.' }
    if (!(await gemini.ping(key, model()))) return { ok: false, msg: `O Gemini recusou essa chave (ou o modelo ${model()} não está liberado para ela).` }
    if (!secrets.set('gemini', key)) return { ok: false, msg: 'Não consegui guardar a chave com segurança neste PC.' }
    return { ok: true, msg: 'Chave do Gemini salva. Use "Pedir à IA" na busca.' }
  }

  async function clearKey() {
    secrets.clear('gemini')
    return { ok: true, msg: 'Chave do Gemini removida.' }
  }

  async function fallback(query, why) {
    const r = await catalog.search(query)
    return { ok: true, items: r.items, msg: `${why} Mostrei a busca normal.` }
  }

  async function discover(tk, f) {
    const items = []
    for (const kind of ai.kindsFor(f)) {
      const ids = resolveProviders(await tmdb.providers(tk, kind))
      const wanted = f.services.length ? f.services : Object.keys(ids)
      const pids = wanted.map((s) => ids[s]).filter(Boolean)
      const service = f.services.length === 1 ? f.services[0] : undefined
      for (const r of await tmdb.discoverWith(tk, kind, ai.discoverParams(f, kind, pids))) {
        const it = toItem(r, kind, service)
        if (it) items.push(it)
      }
    }
    return items.sort((a, b) => b.popularity - a.popularity).slice(0, MAX_ITEMS)
  }

  // "Parecido com X": acha X no TMDB e usa as recomendações dele
  async function similar(tk, f) {
    const [first] = searchItems(await tmdb.search(tk, f.similarTo))
    if (!first) return discover(tk, f)
    const ref = parseItemId(first.id)
    return (await tmdb.recommendations(tk, ref.kind, ref.id)).map((r) => toItem(r, ref.kind)).filter(Boolean).slice(0, MAX_ITEMS)
  }

  // Gemini com o modelo reserva quando o escolhido está sobrecarregado.
  // Só conta no limite do dia quando o Gemini respondeu.
  async function generate(gk, used, req) {
    let reply
    try {
      reply = await gemini.generate(gk, model(), req)
    } catch (e) {
      if (e.code !== 'overloaded' || model() === FALLBACK_MODEL) throw e
      reply = await gemini.generate(gk, FALLBACK_MODEL, req)
    }
    await writeUsage({ day: today(), count: used + 1 })
    return reply
  }

  // "Parecido com este": a IA diz o clima e sugere títulos; cada um é conferido no TMDB.
  // Sem IA (sem chave, limite do dia, erro), usa só as recomendações do TMDB.
  const moodCache = new Map()
  async function moodPicks(tk, item, ref) {
    const gk = secrets.get('gemini')
    if (!gk) return null
    const used = await usedToday()
    if (used >= LIMIT) return null
    let parsed
    try {
      parsed = aiMood.parseMoodResponse(await generate(gk, used, { system: aiMood.MOOD_PROMPT, user: aiMood.moodUserText(item), schema: aiMood.moodSchema() }))
    } catch { return null }
    if (!parsed) return null
    const found = await Promise.all(parsed.picks.map(async (p) => aiMood.matchPick(await tmdb.search(tk, p.title).catch(() => []), p)))
    return { mood: parsed.mood, items: found.filter((x) => x && x.id !== ref) }
  }

  async function similarMood(item) {
    const ref = item && typeof item.id === 'string' ? parseItemId(item.id) : null
    if (!ref || !item.title) return { ok: false, items: [], msg: 'Título inválido.' }
    const tk = secrets.get('tmdb')
    if (!tk) return { ok: false, items: [], msg: 'Configure a chave do TMDB em Configurações.' }
    if (moodCache.has(item.id)) return moodCache.get(item.id)
    try {
      const fromAi = await moodPicks(tk, item, item.id)
      const items = fromAi ? [...fromAi.items] : []
      if (items.length < MOOD_MIN) {
        for (const r of await tmdb.recommendations(tk, ref.kind, ref.id)) {
          const it = toItem(r, ref.kind)
          if (it && it.id !== item.id && !items.some((x) => x.id === it.id)) items.push(it)
        }
      }
      const result = { ok: true, ai: !!fromAi, mood: fromAi ? fromAi.mood : '', items: items.slice(0, MAX_ITEMS) }
      moodCache.set(item.id, result)
      return result
    } catch (e) {
      return { ok: false, items: [], msg: 'Não consegui buscar no TMDB: ' + e.message }
    }
  }

  async function ask(raw) {
    const query = typeof raw === 'string' ? raw.trim() : ''
    if (query.length < 2 || query.length > 300) return { ok: false, items: [], msg: 'Escreva o pedido com 2 a 300 letras.' }
    const gk = secrets.get('gemini')
    if (!gk) return { ok: false, items: [], msg: 'Configure a chave do Gemini em Configurações.' }
    const tk = secrets.get('tmdb')
    if (!tk) return { ok: false, items: [], msg: 'Configure a chave do TMDB em Configurações: é ele que acha os títulos.' }
    const used = await usedToday()
    if (used >= LIMIT) return { ok: false, items: [], msg: `Você já fez os ${LIMIT} pedidos à IA de hoje. Amanhã libera de novo; a busca normal continua funcionando.` }
    let reply
    try { reply = await generate(gk, used, { system: ai.SYSTEM_PROMPT, user: query, schema: ai.responseSchema() }) } catch (e) { return fallback(query, e.message) }
    const filters = ai.parseAiResponse(reply)
    if (!filters) return fallback(query, 'A IA não respondeu num formato válido.')
    if (filters.offTopic) return { ok: false, items: [], msg: 'Esse pedido não parece ser sobre filmes ou séries.' }
    try {
      const items = filters.similarTo ? await similar(tk, filters) : await discover(tk, filters)
      return { ok: true, items, explanation: filters.explanation }
    } catch (e) {
      return { ok: false, items: [], msg: 'Não consegui buscar no TMDB: ' + e.message }
    }
  }

  return { status, setKey, clearKey, ask, similarMood }
}

module.exports = { createAssistant, LIMIT }
