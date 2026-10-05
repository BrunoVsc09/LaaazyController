// Gemini no Laaazy: só o "Parecido com este" (△ no Início). O "Pedir à IA" da Busca saiu.
// Limite de 50 pedidos por dia (protege a cota da chave); sem IA, usa as recomendações do TMDB.
const aiMood = require('../core/ai-mood')
const { toItem, parseItemId } = require('../core/catalog')
const { cleanKey, wrongKeyMsg } = require('../core/keys')

const LIMIT = 50
const FALLBACK_MODEL = 'gemini-flash-latest' // reserva quando o modelo escolhido está sobrecarregado
const DAY = 24 * 3600 * 1000
const MAX_ITEMS = 20
const MOOD_MIN = 6 // fileira do "Parecido com este" completa com recomendações do TMDB até aqui

function createAssistant({ gemini, tmdb, secrets, model, readUsage, writeUsage, now = Date.now }) {
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
    if (wrongKeyMsg(key, 'gemini')) return { ok: false, msg: wrongKeyMsg(key, 'gemini') }
    if (!(await gemini.ping(key, model()))) return { ok: false, msg: `O Gemini recusou essa chave (ou o modelo ${model()} não está liberado para ela).` }
    if (!secrets.set('gemini', key)) return { ok: false, msg: 'Não consegui guardar a chave com segurança neste PC.' }
    return { ok: true, msg: 'Chave do Gemini salva. Aperte △ num título do Início para ver os parecidos.' }
  }

  async function clearKey() {
    secrets.clear('gemini')
    return { ok: true, msg: 'Chave do Gemini removida.' }
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

  return { status, setKey, clearKey, similarMood }
}

module.exports = { createAssistant, LIMIT }
