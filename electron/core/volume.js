// Volume do Windows pelo controle ou por atalho global. Sem I/O.
const VK = { up: 175, down: 174, mute: 173 } // VK_VOLUME_UP / DOWN / MUTE
const PRESSES = { up: 2, down: 2, mute: 1 }   // cada tecla de volume = 2%

// No DS4Windows, mapeie botões para F20–F22 para mudar o volume com o Edge ou um jogo na frente
const SHORTCUTS = [
  { accel: 'F22', action: 'up' },
  { accel: 'F21', action: 'down' },
  { accel: 'F20', action: 'mute' },
  { accel: 'CommandOrControl+Alt+Up', action: 'up' },
  { accel: 'CommandOrControl+Alt+Down', action: 'down' },
  { accel: 'CommandOrControl+Alt+M', action: 'mute' },
]

// Linha de PowerShell (com $w = WScript.Shell já criado) que aperta a tecla de volume
function psLine(action) {
  if (!(action in VK)) return null
  return Array(PRESSES[action]).fill(`$w.SendKeys([char]${VK[action]})`).join(';')
}

module.exports = { VK, SHORTCUTS, psLine }
