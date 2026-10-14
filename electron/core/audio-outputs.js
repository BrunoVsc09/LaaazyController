// Saída de som do Windows (Configurações → Som): lista curta e saída preferida. Sem I/O.

// Escondidas da lista curta: modo telefone do Bluetooth (som mono), Steam e saídas virtuais
const HIDDEN = [/hands-free/i, /steam streaming/i, /voicemeeter/i, /vb-audio/i]
const isHidden = (name) => HIDDEN.some((r) => r.test(name))
const byName = (a, b) => a.name.localeCompare(b.name, 'pt-BR')

// Uma saída por linha (o adapter imprime assim): id <tab> nome <tab> 1 se for a padrão
function parseOutputs(text) {
  return String(text).split(/\r?\n/).map((line) => line.split('\t'))
    .filter(([id, name, def]) => id && name && (def === '0' || def === '1'))
    .map(([id, name, def]) => ({ id, name, isDefault: def === '1' }))
}

// Lista curta (ou todas). A preferida sempre aparece: foi a pessoa que escolheu
function visibleOutputs(list, { all = false, preferredId = null } = {}) {
  const keep = (o) => all || !isHidden(o.name) || o.id === preferredId
  const items = list.filter(keep).sort(byName)
  return { items, hidden: list.length - items.length }
}

// Saída para onde mandar o som ao abrir o Laaazy: a preferida, se estiver conectada e ainda não for
// a padrão. Se o Windows trocou o id (pareou de novo o Bluetooth), acha pelo nome
function pickPreferred(list, preferred) {
  if (!preferred) return null
  const found = list.find((o) => o.id === preferred.id) || list.find((o) => o.name === preferred.name)
  return found && !found.isDefault ? found : null
}

const isText = (v) => typeof v === 'string' && v.length > 0 && v.length <= 300
function validPreferred(v) {
  if (v === null) return true
  return !!v && typeof v === 'object' && !Array.isArray(v) &&
    Object.keys(v).sort().join() === 'id,name' && isText(v.id) && isText(v.name)
}

module.exports = { parseOutputs, visibleOutputs, pickPreferred, validPreferred }
