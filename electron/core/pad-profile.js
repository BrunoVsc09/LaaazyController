// Perfil do Laaazy-pad (arquivo <Nome>.json, formato do docs/PERFIS.md de lá): ler, saber o que
// é fixo do Laaazy e mudar um botão. Sem I/O. As ações aceitas são as mesmas do Laaazy-pad:
// { tecla: "Ctrl+Alt+Home" }, { clique: "esquerdo" } ou nada (o botão sai do perfil).

// Botões na ordem da tela; id = nome no perfil do Laaazy-pad
const BUTTONS = [
  ['Cruz', '✕'], ['Circulo', '○'], ['Quadrado', '□'], ['Triangulo', '△'],
  ['L1', 'L1'], ['R1', 'R1'], ['L2', 'L2'], ['R2', 'R2'], ['L3', 'L3'], ['R3', 'R3'],
  ['Share', 'Share'], ['Options', 'Options'], ['PS', 'PS'], ['Touchpad', 'Touchpad (apertar)'],
  ['DpadCima', 'D-pad ↑'], ['DpadBaixo', 'D-pad ↓'], ['DpadEsquerda', 'D-pad ←'], ['DpadDireita', 'D-pad →'],
].map(([id, label]) => ({ id, label }))
const IDS = new Set(BUTTONS.map((b) => b.id))

// Comandos de que o Laaazy depende: o PS volta ao Início (nos dois perfis); no PC, Share abre o
// teclado por cima e L2/R2 mudam o volume
const LOCKED_ALL = ['PS']
const LOCKED_PC = ['Share', 'L2', 'R2']
const isLocked = (profile, id) =>
  LOCKED_ALL.includes(id) || (String(profile).toLowerCase() === 'pc' && LOCKED_PC.includes(id))

const MODIFIERS = ['ctrl', 'control', 'alt', 'shift', 'win']
const KEYS = new Set([
  ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''), ...'0123456789'.split(''),
  ...Array.from({ length: 12 }, (_, i) => `F${i + 1}`), ...Array.from({ length: 10 }, (_, i) => `Num${i}`),
  'Enter', 'Escape', 'Esc', 'Tab', 'Space', 'Backspace', 'Delete', 'Del', 'Insert',
  'Home', 'End', 'PageUp', 'PageDown', 'Up', 'Down', 'Left', 'Right',
  'PrintScreen', 'VolumeUp', 'VolumeDown', 'VolumeMute', 'MediaPlayPause', 'MediaNext', 'MediaPrevious',
].map((k) => k.toLowerCase()))
const CLICKS = ['esquerdo', 'direito', 'meio', 'voltar', 'avancar']

// "Ctrl+Alt+Home": modificadores (sem repetir) e uma tecla no fim, como o LeitorDeAtalho de lá
function validShortcut(text) {
  if (typeof text !== 'string' || text.length > 60) return false
  const parts = text.split('+').map((p) => p.trim().toLowerCase())
  if (parts.some((p) => !p)) return false
  const mods = parts.slice(0, -1).map((m) => (m === 'control' ? 'ctrl' : m))
  if (mods.some((m) => !MODIFIERS.includes(m)) || new Set(mods).size !== mods.length) return false
  return KEYS.has(parts[parts.length - 1])
}

function validAction(action) {
  if (action === null) return true
  if (!action || typeof action !== 'object' || Object.keys(action).length !== 1) return false
  if ('tecla' in action) return validShortcut(action.tecla)
  if ('clique' in action) return CLICKS.includes(action.clique)
  return false
}

// Tira comentários // e /* */ fora de textos (o Laaazy-pad aceita JSON com comentários)
function stripComments(text) {
  let out = ''
  let inString = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inString) {
      out += c
      if (c === '\\') { out += text[++i] ?? ''; continue }
      if (c === '"') inString = false
    } else if (c === '"') { inString = true; out += c }
    else if (c === '/' && text[i + 1] === '/') { while (i < text.length && text[i] !== '\n') i++; out += '\n' }
    else if (c === '/' && text[i + 1] === '*') { i = text.indexOf('*/', i + 2); if (i < 0) return null; i++ }
    else out += c
  }
  return out
}

function parseProfile(text) {
  const clean = stripComments(String(text ?? ''))
  if (clean === null) return null
  try {
    const data = JSON.parse(clean)
    return data && typeof data === 'object' && !Array.isArray(data) ? data : null
  } catch { return null }
}

const STICK = (s) => (s?.mouse ? 'Mover o mouse' : s?.rolagem ? 'Rolagem' : 'Nada (o jogo lê)')

// O perfil para a tela: cada botão com a ação (null = nada) e se é fixo
function describeProfile(text, name) {
  const data = parseProfile(text)
  if (!data) return null
  const keys = data.botoes && typeof data.botoes === 'object' ? data.botoes : {}
  return {
    name,
    buttons: BUTTONS.map((b) => ({ ...b, action: validAction(keys[b.id]) ? keys[b.id] : null, locked: isLocked(name, b.id) })),
    sticks: { esquerdo: STICK(data.analogicos?.esquerdo), direito: STICK(data.analogicos?.direito), touchpad: STICK(data.touchpad) },
  }
}

// Muda um botão e devolve o texto novo do arquivo (o resto do perfil fica igual; os comentários
// do arquivo original não voltam)
function setButton(text, name, id, action) {
  if (!IDS.has(id)) return { ok: false, msg: `Botão desconhecido: ${id}.` }
  if (isLocked(name, id)) return { ok: false, msg: `${id} é um comando fixo do Laaazy e não pode mudar.` }
  if (!validAction(action)) return { ok: false, msg: action && 'tecla' in action ? `Atalho inválido: ${action.tecla}.` : 'Ação inválida.' }
  const data = parseProfile(text)
  if (!data) return { ok: false, msg: 'O arquivo do perfil está com erro; nada foi mudado.' }
  const botoes = { ...(data.botoes || {}) }
  if (action === null) delete botoes[id]
  else botoes[id] = action
  return { ok: true, text: JSON.stringify({ ...data, botoes }, null, 2) + '\n' }
}

module.exports = { BUTTONS, CLICKS, isLocked, validAction, parseProfile, describeProfile, setButton }
