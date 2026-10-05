// Chamadas HTTP à API do Gemini. A chave vai só no cabeçalho x-goog-api-key, nunca na URL.
const BASE = 'https://generativelanguage.googleapis.com/v1beta/models/'
const MODEL = /^[a-z0-9][a-z0-9.-]{0,60}$/
const TIMEOUT_MS = 15000

// Erros temporários do servidor do Google: espera e tenta de novo (até 2 vezes)
const RETRY = new Set([500, 502, 503, 504])
const BACKOFF_MS = [800, 1600]

function createGemini({ fetch = globalThis.fetch, sleep = (ms) => new Promise((r) => setTimeout(r, ms)) } = {}) {
  const headers = (key) => ({ 'x-goog-api-key': key, 'Content-Type': 'application/json' })
  const signal = () => (typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(TIMEOUT_MS) : undefined)

  function checkModel(model) {
    if (!MODEL.test(model || '')) throw new Error('Modelo inválido.')
  }

  function httpError(status, model) {
    if (status === 429) return new Error('Você passou do limite de uso do Gemini (por minuto ou por hoje). Tente mais tarde.')
    if (status === 400 || status === 401 || status === 403) return new Error('O Gemini recusou a chave ou o pedido.')
    if (status === 404) return new Error(`Modelo não encontrado: ${model}.`)
    return new Error(`O Gemini respondeu com erro ${status}.`)
  }

  // Devolve o texto (JSON) da resposta
  async function generate(key, model, { system, user, schema }) {
    checkModel(model)
    const body = JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig: { responseMimeType: 'application/json', responseSchema: schema, temperature: 0.2, maxOutputTokens: 1024 },
    })
    let res
    for (let attempt = 0; ; attempt++) {
      try {
        res = await fetch(`${BASE}${model}:generateContent`, { method: 'POST', headers: headers(key), signal: signal(), body })
      } catch (e) {
        if (e && (e.name === 'TimeoutError' || e.name === 'AbortError')) throw new Error('O Gemini demorou demais para responder.')
        throw new Error('Sem conexão com o Gemini.')
      }
      if (!RETRY.has(res.status)) break
      if (attempt >= BACKOFF_MS.length) {
        throw Object.assign(new Error(`O Gemini está sobrecarregado agora (erro ${res.status}). Tente de novo em alguns minutos.`), { code: 'overloaded' })
      }
      await sleep(BACKOFF_MS[attempt])
    }
    if (!res.ok) throw httpError(res.status, model)
    const data = await res.json()
    if (data.promptFeedback && data.promptFeedback.blockReason) throw new Error('O Gemini bloqueou o pedido.')
    const cand = (data.candidates || [])[0]
    const out = cand && cand.content && (cand.content.parts || []).map((p) => p.text || '').join('')
    if (!cand || cand.finishReason !== 'STOP' || !out) throw new Error('Resposta incompleta do Gemini.')
    return out
  }

  // A chave enxerga o modelo?
  async function ping(key, model) {
    try {
      checkModel(model)
      const res = await fetch(`${BASE}${model}`, { headers: headers(key), signal: signal() })
      return res.ok
    } catch { return false }
  }

  return { generate, ping }
}

module.exports = { createGemini }
