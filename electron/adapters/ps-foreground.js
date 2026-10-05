// PowerShell aberto em segundo plano para falar com as janelas do Windows rápido:
// descobrir qual programa está na frente e trazer o Laaazy para a frente de verdade.
const { spawn } = require('child_process')
const { focusCommand } = require('../core/focus')

// Focus: o Windows bloqueia que um programa em segundo plano tome o foco. Simular o
// aperto do Alt antes do SetForegroundWindow é o jeito aceito de liberar isso.
const SETUP = "Add-Type -TypeDefinition 'using System;using System.Runtime.InteropServices;public class FG{" +
  '[DllImport("user32.dll")]public static extern IntPtr GetForegroundWindow();' +
  '[DllImport("user32.dll")]public static extern uint GetWindowThreadProcessId(IntPtr h,out uint p);' +
  '[DllImport("user32.dll")]public static extern bool SetForegroundWindow(IntPtr h);' +
  '[DllImport("user32.dll")]public static extern bool ShowWindow(IntPtr h,int c);' +
  '[DllImport("user32.dll")]public static extern void keybd_event(byte k,byte s,uint f,UIntPtr e);' +
  'public static void Focus(IntPtr h){keybd_event(0x12,0,0,UIntPtr.Zero);ShowWindow(h,5);SetForegroundWindow(h);keybd_event(0x12,0,2,UIntPtr.Zero);}' +
  // Cursor preso no retângulo da janela do Laaazy (Clip) e solto de novo (Unclip)
  '[StructLayout(LayoutKind.Sequential)]public struct R{public int l,t,r,b;}' +
  '[DllImport("user32.dll")]public static extern bool ClipCursor(ref R r);' +
  '[DllImport("user32.dll",EntryPoint="ClipCursor")]public static extern bool ClipNone(IntPtr p);' +
  'public static void Clip(int l,int t,int r,int b){R x;x.l=l;x.t=t;x.r=r;x.b=b;ClipCursor(ref x);}' +
  'public static void Unclip(){ClipNone(IntPtr.Zero);}' +
  "}'\n"
const QUERY = '$p=0;[void][FG]::GetWindowThreadProcessId([FG]::GetForegroundWindow(),[ref]$p);$n=(Get-Process -Id $p -ErrorAction SilentlyContinue).ProcessName;"FGPID:${p}:$n"\n'
const QUERY_HWND = '"FGHWND:" + [FG]::GetForegroundWindow().ToInt64()\n'
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

  // Identificador (HWND) da janela que está na frente, como texto; '' se não deu
  function hwnd() {
    return new Promise((resolve) => {
      warm()
      if (!ps) return resolve('')
      const proc = ps
      let buf = ''
      const done = (v) => { clearTimeout(tm); proc.stdout.off('data', onData); resolve(v) }
      const onData = (d) => {
        buf += d
        const m = buf.match(/FGHWND:(\d+)\r?\n/)
        if (m) done(m[1])
      }
      const tm = setTimeout(() => done(''), 3000)
      proc.stdout.on('data', onData)
      proc.stdin.write(QUERY_HWND)
    })
  }

  // Traz a janela (pelo HWND) para a frente com foco de teclado/controle
  function focus(hwnd) {
    const cmd = focusCommand(hwnd)
    if (!cmd) return
    warm()
    if (ps) ps.stdin.write(cmd + '\n')
  }

  // Comando já montado e validado pelo core (ex.: clipCommand / UNCLIP)
  function run(line) {
    warm()
    if (ps) ps.stdin.write(line + '\n')
  }

  const dispose = () => { try { ps && ps.kill() } catch {} }

  return { warm, info, hwnd, focus, run, dispose }
}

module.exports = { createForegroundProbe }
