// "Minha lista": filmes e séries salvos no PC para ver depois (sem conta).
const { parseItemId } = require('../core/catalog')

const MAX = 200
const FIELDS = ['id', 'kind', 'title', 'year', 'overview', 'poster', 'backdrop', 'popularity', 'services']

// Guarda só os campos conhecidos de um título válido
function clean(item) {
  if (!item || typeof item !== 'object' || !parseItemId(item.id) || typeof item.title !== 'string' || !item.title) return null
  const out = {}
  for (const f of FIELDS) if (item[f] !== undefined) out[f] = item[f]
  if (!Array.isArray(out.services)) out.services = []
  return out
}

function createMyList({ read, write }) {
  const get = () => read()

  async function toggle(raw) {
    const item = clean(raw)
    if (!item) return { ok: false, msg: 'Título inválido.' }
    const list = await read()
    const has = list.some((x) => x.id === item.id)
    const next = has ? list.filter((x) => x.id !== item.id) : [item, ...list].slice(0, MAX)
    const ok = await write(next)
    return ok ? { ok: true, added: !has } : { ok: false, msg: 'Não consegui salvar a Minha lista.' }
  }

  return { get, toggle }
}

module.exports = { createMyList }
