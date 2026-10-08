// Trazer o Laaazy de volta para a frente e saber quando voltar sozinho. Sem I/O.

// HWND da janela (Buffer de getNativeWindowHandle) → texto com o número
function hwndFrom(buf) {
  if (!buf || !buf.length) return null
  return buf.length >= 8 ? buf.readBigUInt64LE(0).toString() : String(buf.readUInt32LE(0))
}

// Linha para o PowerShell residente; só aceita número (nada de texto vindo de fora)
const focusCommand = (hwnd) => (/^\d+$/.test(String(hwnd || '')) ? `[FG]::Focus([IntPtr]${hwnd})` : null)

// Prender o cursor no retângulo da janela (pixels de tela). Só números inteiros vão para o PowerShell.
const UNCLIP = '[FG]::Unclip()'
// Tecla neutra (VK E8): soltar o Alt de um atalho não leva o Edge ao menu do navegador
const MASK_MENU = '[FG]::Mask()'
function clipCommand(r) {
  if (!r) return null
  const v = [r.x, r.y, r.width, r.height]
  if (!v.every(Number.isInteger) || r.width <= 0 || r.height <= 0) return null
  return `[FG]::Clip(${r.x},${r.y},${r.x + r.width},${r.y + r.height})`
}

// Cursor dentro de um retângulo (teclado por cima): prende e leva para o meio.
// No perfil PC o X também é clique do mouse; fora do teclado, esse clique ativaria o Edge.
function confineCommands(r) {
  const clip = clipCommand(r)
  if (!clip) return []
  return [clip, `[FG]::Move(${r.x + Math.floor(r.width / 2)},${r.y + Math.floor(r.height / 2)})`]
}

// O que conta como "voltou para casa": área de trabalho, launchers e o próprio Laaazy
const HOME = new Set(['', 'explorer', 'steam', 'steamwebhelper', 'epicgameslauncher', 'laaazy', 'electron'])
const GIVE_UP_MS = 90 * 1000

const startWatch = (now) => ({ phase: 'waiting', since: now })

function isHome({ name, pid }, { selfPid, ownPids }) {
  return pid === selfPid || ownPids.includes(pid) || HOME.has(String(name || '').toLowerCase())
}

// waiting: esperando o jogo/Edge aparecer na frente (o Steam pode demorar a abrir o jogo).
// Se não aparecer até GIVE_UP_MS, traz o Laaazy de volta (ele foi minimizado ao abrir o jogo).
// away: o jogo/Edge apareceu; quando sobrar só "casa" na frente, é hora de voltar
function watchStep(state, info, ctx, now) {
  const idle = { state: { phase: 'idle' }, action: null }
  if (state.phase === 'waiting') {
    if (!isHome(info, ctx)) return { state: { phase: 'away' }, action: null }
    return now - state.since > GIVE_UP_MS ? { state: { phase: 'idle' }, action: 'return' } : { state, action: null }
  }
  if (state.phase === 'away') {
    return isHome(info, ctx) ? { state: { phase: 'idle' }, action: 'return' } : { state, action: null }
  }
  return idle
}

module.exports = { hwndFrom, focusCommand, clipCommand, confineCommands, UNCLIP, MASK_MENU, startWatch, watchStep }
