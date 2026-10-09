// Fala com o Laaazy-pad de verdade (processo, pasta de perfis, LaaazyPadCmd.exe).
// Contrato: docs/CONTRATO.md do projeto Laaazy-pad. Mesma interface do antigo adaptador do
// DS4Windows, para o services/ds4.js mudar o mínimo.
const fs = require('fs')
const path = require('path')
const childProcess = require('child_process')

const PROCESS = 'LaaazyPad.exe'
const CMD = 'LaaazyPadCmd.exe' // sempre vem junto, na mesma pasta

function createLaaazyPadCli({
  openPath, execFile = childProcess.execFile, spawn = childProcess.spawn,
  readdir = (d) => fs.promises.readdir(d), env = process.env,
  files = {
    readFile: (p) => fs.promises.readFile(p, 'utf8'), writeFile: (p, t) => fs.promises.writeFile(p, t, 'utf8'),
    rename: (a, b) => fs.promises.rename(a, b), copyFile: (a, b) => fs.promises.copyFile(a, b), exists: fs.existsSync,
  },
}) {
  // Roda um comando no LaaazyPadCmd.exe → { code, out, err } (saídas em UTF-8)
  const run = (exe, command) => new Promise((res) =>
    execFile(path.join(path.dirname(exe), CMD), ['-command', command],
      { cwd: path.dirname(exe), windowsHide: true, timeout: 4000, encoding: 'utf8' },
      (e, out, err) => res({ code: e ? (Number.isInteger(e.code) ? e.code : -1) : 0, out: String(out || '').trim(), err: String(err || '').trim() })))

  // '' quando deu certo; senão a mensagem do Laaazy-pad (em português) ou o código
  const message = (r) => (r.code === 0 ? '' : r.err || `O Laaazy-pad saiu com o código ${r.code}.`)

  // Profiles ao lado do exe (modo portátil) se existir; senão %APPDATA%\Laaazy-pad\Profiles
  async function listProfiles(exe) {
    const dirs = [path.join(path.dirname(exe), 'Profiles'), path.join(env.APPDATA || '', 'Laaazy-pad', 'Profiles')]
    for (const d of dirs) {
      let names
      try { names = await readdir(d) } catch { continue }
      const profiles = names.filter((n) => /\.json$/i.test(n)).map((n) => n.replace(/\.json$/i, ''))
      return { dir: d, profiles: profiles.sort((a, b) => a.localeCompare(b, 'pt')) }
    }
    return { dir: null, profiles: [] }
  }

  const isRunning = () => new Promise((res) =>
    execFile('tasklist', ['/FI', `IMAGENAME eq ${PROCESS}`, '/NH'], { windowsHide: true },
      (e, out) => res(!e && /LaaazyPad\.exe/i.test(String(out)))))

  // -m: aceito (e ignorado) pelo Laaazy-pad, como no DS4Windows. Se o Windows recusar, abre pelo Windows.
  const start = (exe) => new Promise((res) => {
    try {
      const c = spawn(exe, ['-m'], { cwd: path.dirname(exe), detached: true, stdio: 'ignore', windowsHide: true })
      c.on('spawn', () => res(''))
      c.on('error', async () => res(await openPath(exe)))
      c.unref()
    } catch { openPath(exe).then(res) }
  })

  const loadProfile = async (exe, name) => message(await run(exe, 'LoadProfile.1.' + name))

  // Sempre confirma; código diferente de 0 (1 = fechado) → sem perfil
  async function queryProfile(exe) {
    const r = await run(exe, 'Query.1.ProfileName')
    return r.code === 0 ? r.out : null
  }

  const shutdown = async (exe) => (exe ? message(await run(exe, 'shutdown')) : '')
  const kill = () => new Promise((res) => execFile('taskkill', ['/IM', PROCESS, '/T', '/F'], { windowsHide: true }, () => res()))
  const cmdName = (exe) => (exe ? CMD : '')

  // Arquivo <Nome>.json do perfil (editor de perfis do Laaazy). O nome nunca sai da pasta.
  const NAME = /^[^\\/:*?"<>|.][^\\/:*?"<>|]{0,60}$/
  const fileOf = (dir, name) => (NAME.test(String(name)) ? path.join(dir, name + '.json') : null)

  async function readProfile(dir, name) {
    const f = fileOf(dir, name)
    if (!f) return null
    try { return await files.readFile(f) } catch { return null }
  }

  // Grava num .tmp e troca no fim (nunca fica pela metade); na 1ª vez guarda o original em .bak
  async function writeProfile(dir, name, text) {
    const f = fileOf(dir, name)
    if (!f) return 'Nome de perfil inválido.'
    try {
      if (files.exists(f) && !files.exists(f + '.bak')) await files.copyFile(f, f + '.bak')
      await files.writeFile(f + '.tmp', text)
      await files.rename(f + '.tmp', f)
      return ''
    } catch (e) { return 'Não consegui salvar o perfil: ' + e.message }
  }

  return { listProfiles, isRunning, start, loadProfile, queryProfile, shutdown, kill, cmdName, readProfile, writeProfile }
}

module.exports = { createLaaazyPadCli }
