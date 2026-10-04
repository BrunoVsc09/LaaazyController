// Fala com o DS4Windows de verdade (processos, pasta de perfis, DS4WindowsCmd).
const fs = require('fs')
const path = require('path')
const { spawn, execFile } = require('child_process')

// No DS4Windows 3.x o recomendado é o DS4WindowsCmd.exe (baixado à parte, na mesma pasta)
function cmdExe(exe) {
  const c = path.join(path.dirname(exe), 'DS4WindowsCmd.exe')
  return fs.existsSync(c) ? c : exe
}

// Roda um comando e espera no máximo 3s (o DS4Windows às vezes não termina sozinho)
function runCommand(exe, command) {
  return new Promise((res) => {
    let c
    try {
      c = spawn(cmdExe(exe), ['-command', command], { cwd: path.dirname(exe), stdio: 'ignore', windowsHide: true })
    } catch (e) { return res(e.message) }
    const t = setTimeout(() => { try { c.kill() } catch {} res('') }, 3000)
    c.on('error', (e) => { clearTimeout(t); res(e.message) })
    c.on('exit', () => { clearTimeout(t); res('') })
  })
}

function createDs4Cli({ openPath }) {
  async function listProfiles(exe) {
    const dirs = [path.join(path.dirname(exe), 'Profiles'), path.join(process.env.APPDATA || '', 'DS4Windows', 'Profiles')]
    for (const d of dirs) {
      try {
        const names = (await fs.promises.readdir(d)).filter((n) => /\.xml$/i.test(n)).map((n) => n.replace(/\.xml$/i, ''))
        if (names.length) return { dir: d, profiles: names.sort((a, b) => a.localeCompare(b, 'pt')) }
      } catch {}
    }
    return { dir: null, profiles: [] }
  }

  const isRunning = () => new Promise((res) =>
    execFile('tasklist', ['/FI', 'IMAGENAME eq DS4Windows.exe', '/NH'], { windowsHide: true },
      (e, out) => res(!e && /DS4Windows\.exe/i.test(String(out)))))

  // -m = minimizado. Se o Windows recusar (ex.: pede administrador), abre do jeito normal.
  const start = (exe) => new Promise((res) => {
    try {
      const c = spawn(exe, ['-m'], { cwd: path.dirname(exe), detached: true, stdio: 'ignore' })
      c.on('error', async () => res(await openPath(exe)))
      c.unref()
      setTimeout(() => res(''), 600)
    } catch { openPath(exe).then(res) }
  })

  const loadProfile = (exe, name) => runCommand(exe, 'LoadProfile.1.' + name)

  // Só dá para confirmar com o DS4WindowsCmd.exe na pasta
  async function queryProfile(exe) {
    const tool = cmdExe(exe)
    if (!/DS4WindowsCmd\.exe$/i.test(tool)) return null
    await new Promise((r) => setTimeout(r, 700))
    return new Promise((res) =>
      execFile(tool, ['-command', 'Query.1.ProfileName'], { cwd: path.dirname(exe), windowsHide: true, timeout: 4000 },
        (e, out) => res(e ? null : String(out).trim())))
  }

  const shutdown = (exe) => (exe ? runCommand(exe, 'shutdown') : Promise.resolve(''))
  const kill = () => new Promise((res) => execFile('taskkill', ['/IM', 'DS4Windows.exe', '/T', '/F'], { windowsHide: true }, () => res()))
  const cmdName = (exe) => (exe ? path.basename(cmdExe(exe)) : '')

  return { listProfiles, isRunning, start, loadProfile, queryProfile, shutdown, kill, cmdName }
}

module.exports = { createDs4Cli }
