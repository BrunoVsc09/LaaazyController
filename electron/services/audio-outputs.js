// Saída de som do Windows (Configurações → Som): lista curta, trocar e saída preferida.
// A saída escolhida vira a preferida; ao abrir o Laaazy, se ela estiver conectada, o som vai para ela.
const core = require('../core/audio-outputs')

function createAudioOutputs({ listOutputs, setDefaultOutput, settings }) {
  const preferred = () => {
    const p = settings.get('audioOutput')
    return p && core.validPreferred(p) ? p : null
  }

  async function read() {
    const r = await listOutputs()
    return r.ok ? core.parseOutputs(r.text) : null
  }

  async function outputs({ all = false } = {}) {
    const list = await read()
    if (!list) return { ok: false, items: [], hidden: 0, msg: 'Não consegui ler as saídas de som do Windows.' }
    const p = preferred()
    const v = core.visibleOutputs(list, { all, preferredId: p && p.id })
    const isPreferred = (o) => !!p && (o.id === p.id || o.name === p.name)
    return { ok: true, items: v.items.map((o) => ({ ...o, preferred: isPreferred(o) })), hidden: v.hidden }
  }

  async function choose(id) {
    const out = (await read() || []).find((o) => o.id === id)
    if (!out) return { ok: false, msg: 'Essa saída de som não está mais conectada.' }
    const r = await setDefaultOutput(out.id)
    if (!r.ok) return { ok: false, msg: `Não consegui trocar a saída de som (código ${r.code}).` }
    settings.set('audioOutput', { id: out.id, name: out.name })
    return { ok: true, msg: `Som saindo em ${out.name}. Ela fica como preferida: ao abrir, o Laaazy volta para ela.` }
  }

  async function start() {
    const p = preferred()
    if (!p) return
    const pick = core.pickPreferred(await read() || [], p)
    if (pick) await setDefaultOutput(pick.id)
  }

  return { outputs, choose, start }
}

module.exports = { createAudioOutputs }
