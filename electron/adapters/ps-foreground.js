// Descobre qual programa está em primeiro plano. Um PowerShell fica aberto em
// segundo plano para o atalho responder rápido.
const { spawn } = require('child_process')

const SETUP = "Add-Type -TypeDefinition 'using System;using System.Runtime.InteropServices;public class FG{[DllImport(\"user32.dll\")]public static extern IntPtr GetForegroundWindow();[DllImport(\"user32.dll\")]public static extern uint GetWindowThreadProcessId(IntPtr h,out uint p);}'\n"
const QUERY = '$p=0;[void][FG]::GetWindowThreadProcessId([FG]::GetForegroundWindow(),[ref]$p);$n=(Get-Process -Id $p -ErrorAction SilentlyContinue).ProcessName;"FGPID:${p}:$n"\n'
const NONE = { pid: 0, name: '' }

function createForegroundProbe() {
  let ps = null

  function warm() {
    if (ps) return
    try {
      ps = spawn('powershell.exe', ['-NoLogo', '-NoProfile', '-NonInteractive', '-Command', '-'], { windowsHide: true })
      ps.stdout.setEncoding('utf8')
      ps.on('error', () => { ps = null })
      ps.on('exit', () => { ps = null })
      ps.stdin.write(SETUP)
    } catch { ps = null }
  }

  function info() {
    return new Promise((resolve) => {
      warm()
      if (!ps) return resolve(NONE)
      const proc = ps
      let buf = ''
      const done = (v) => { clearTimeout(tm); proc.stdout.off('data', onData); resolve(v) }
      const onData = (d) => {
        buf += d
        const m = buf.match(/FGPID:(\d+):(\S*)\r?\n/)
        if (m) done({ pid: Number(m[1]), name: m[2] })
      }
      const tm = setTimeout(() => done(NONE), 3000)
      proc.stdout.on('data', onData)
      proc.stdin.write(QUERY)
    })
  }

  const dispose = () => { try { ps && ps.kill() } catch {} }

  return { warm, info, dispose }
}

module.exports = { createForegroundProbe }
