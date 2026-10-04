// PowerShell aberto em segundo plano para apertar teclas do sistema (volume) sem atraso.
const { spawn } = require('child_process')

function createKeySender() {
  let ps = null
  function warm() {
    if (ps) return
    try {
      ps = spawn('powershell.exe', ['-NoLogo', '-NoProfile', '-NonInteractive', '-Command', '-'], { windowsHide: true })
      ps.on('error', () => { ps = null })
      ps.on('exit', () => { ps = null })
      ps.stdin.write('$w = New-Object -ComObject WScript.Shell\n')
    } catch { ps = null }
  }
  function send(line) {
    warm()
    if (ps) ps.stdin.write(line + '\n')
  }
  const dispose = () => { try { ps && ps.kill() } catch {} }
  return { send, dispose }
}

module.exports = { createKeySender }
