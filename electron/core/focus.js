// Trazer o Laaazy de volta para a frente e saber quando voltar sozinho. Sem I/O.

// HWND da janela (Buffer de getNativeWindowHandle) → texto com o número
function hwndFrom(buf) {
  if (!buf || !buf.length) return null
  return buf.length >= 8 ? buf.readBigUInt64LE(0).toString() : String(buf.readUInt32LE(0))
}

// Linha para o PowerShell residente; só aceita número (nada de texto vindo de fora)
const focusCommand = (hwnd) => (/^\d+$/.test(String(hwnd || '')) ? `[FG]::Focus([IntPtr]${hwnd})` : null)

// O que conta como "voltou para casa": área de trabalho, launchers e o próprio Laaazy
const HOME = new Set(['', 'explorer', 'steam', 'steamwebhelper', 'epicgameslauncher', 'laaazy', 'electron'])
const GIVE_UP_MS = 90 * 1000

const startWatch = (now) => ({ phase: 'waiting', since: now })

function isHome({ name, pid }, { selfPid, ownPids }) {
  return pid === selfPid || ownPids.includes(pid) || HOME.has(String(name || '').toLowerCase())
}

// waiting: esperando o jogo/Edge aparecer na frente (o Steam pode demorar a abrir o jogo)
// away: o jogo/Edge apareceu; quando sobrar só "casa" na frente, é hora de voltar
function watchStep(state, info, ctx, now) {
  const idle = { state: { phase: 'idle' }, action: null }
  if (state.phase === 'waiting') {
    if (!isHome(info, ctx)) return { state: { phase: 'away' }, action: null }
    return now - state.since > GIVE_UP_MS ? idle : { state, action: null }
  }
  if (state.phase === 'away') {
    return isHome(info, ctx) ? { state: { phase: 'idle' }, action: 'return' } : { state, action: null }
  }
  return idle
}

module.exports = { hwndFrom, focusCommand, startWatch, watchStep }
