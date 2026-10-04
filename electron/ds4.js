// Troca o perfil do DS4Windows automaticamente (por card) e guarda a escolha.
const fs = require('fs')
const fsp = fs.promises
const path = require('path')
const { spawn, execFile } = require('child_process')
const { readJson, writeJson } = require('./adapters/json-store')

const KEYS = ['menu', 'Crunchyroll', 'HBO Max', 'Prime Video', 'Netflix', 'YouTube', 'Spotify', 'Google Chrome', 'Firefox']

module.exports = function ({ ipcMain, app, shell, exe }) {
  const dir = path.dirname(exe)
  const cfgFile = () => path.join(app.getPath('userData'), 'ds4-profiles.json')
  // Padrões: Menu = Brunera; navegadores e Crunchyroll = PC (troque na tela de perfis se quiser)
  const DEFAULTS = { menu: 'Brunera', Crunchyroll: 'PC', 'Google Chrome': 'PC', Firefox: 'PC' }
  const readCfg = async () => ({ ...DEFAULTS, ...(await readJson(cfgFile(), {})) })
  const profileDirs = [path.join(dir, 'Profiles'), path.join(process.env.APPDATA || '', 'DS4Windows', 'Profiles')]

  async function listProfiles() {
    for (const d of profileDirs) {
      try {
        const names = (await fsp.readdir(d)).filter((n) => /\.xml$/i.test(n)).map((n) => n.replace(/\.xml$/i, ''))
        if (names.length) return { dir: d, profiles: names.sort((a, b) => a.localeCompare(b, 'pt')) }
      } catch {}
    }
    return { dir: null, profiles: [] }
  }

  // No DS4Windows 3.x o recomendado é o DS4WindowsCmd.exe (baixado à parte, na mesma pasta).
  const cmdExe = () => {
    const c = path.join(dir, 'DS4WindowsCmd.exe')
    return fs.existsSync(c) ? c : exe
  }

  const isRunning = () => new Promise((res) =>
    execFile('tasklist', ['/FI', 'IMAGENAME eq DS4Windows.exe', '/NH'], { windowsHide: true },
      (e, out) => res(!e && /DS4Windows\.exe/i.test(String(out)))))

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

  // Abre o DS4Windows em segundo plano (-m = minimizado). Se o Windows recusar (ex.: pede administrador), abre do jeito normal.
  const startDs4 = () => new Promise((res) => {
    try {
      const c = spawn(exe, ['-m'], { cwd: dir, detached: true, stdio: 'ignore' })
      c.on('error', async () => res(await shell.openPath(exe)))
      c.unref()
      setTimeout(() => res(''), 600)
    } catch { shell.openPath(exe).then(res) }
  })

  async function run(name) {
    if (!name) return { ok: true, msg: 'Sem troca de perfil.' }
    const { profiles } = await listProfiles()
    if (!profiles.includes(name)) return { ok: false, msg: `Perfil "${name}" não encontrado na pasta de perfis.` }
    if (!(await isRunning())) {
      if (!fs.existsSync(exe)) return { ok: false, msg: `Não achei o DS4Windows em: ${exe}` }
      const err = await startDs4()
      if (err) return { ok: false, msg: 'Não consegui abrir o DS4Windows: ' + err }
      await sleep(5000)
    }
    const send = await new Promise((res) => {
      // LoadProfile muda o perfil padrão (o que aparece na aba Controllers do DS4Windows)
      const c = spawn(cmdExe(), ['-command', 'LoadProfile.1.' + name], { cwd: dir, stdio: 'ignore', windowsHide: true })
      // Se o comando não terminar sozinho, encerra ele depois de 3s para não travar as próximas trocas
      const t = setTimeout(() => { try { c.kill() } catch {} res({}) }, 3000)
      c.on('error', (e) => { clearTimeout(t); res({ err: e.message }) })
      c.on('exit', () => { clearTimeout(t); res({}) })
    })
    if (send.err) return { ok: false, msg: 'Erro ao enviar o comando: ' + send.err }
    const hint = 'Se nada mudou, veja se o controle 1 está conectado e se o DS4Windows não está rodando como administrador.'
    const now = await queryProfile()
    if (now === null) return { ok: true, msg: `Enviei o perfil "${name}", mas não consegui confirmar. ${hint}` }
    if (now.toLowerCase().includes(name.toLowerCase())) return { ok: true, msg: `Perfil "${name}" ativo no DS4Windows.` }
    return { ok: false, msg: `Enviei "${name}", mas o DS4Windows respondeu "${now.slice(0, 60)}". ${hint}` }
  }

  // Só dá para confirmar se o DS4WindowsCmd.exe estiver na pasta do DS4Windows
  const queryProfile = async () => {
    const tool = cmdExe()
    if (!/DS4WindowsCmd\.exe$/i.test(tool)) return null
    await sleep(700)
    return new Promise((res) =>
      execFile(tool, ['-command', 'Query.1.ProfileName'], { cwd: dir, windowsHide: true, timeout: 4000 },
        (e, out) => res(e ? null : String(out).trim())))
  }

  let chain = Promise.resolve()
  function apply(name) {
    // Limite de 20s por troca: nada fica preso na fila para sempre
    const guarded = () => Promise.race([run(name), sleep(20000).then(() => ({ ok: false, msg: 'A troca demorou demais e foi cancelada.' }))])
    const p = chain.then(guarded)
    chain = p.catch(() => {})
    return p
  }

  const applyFor = async (key) => apply((await readCfg())[key])

  ipcMain.handle('ds4:get', async () => {
    const { dir: pdir, profiles } = await listProfiles()
    return { profiles, dir: pdir, config: await readCfg(), cmd: path.basename(cmdExe()) }
  })
  ipcMain.handle('ds4:set', async (_e, key, val) => {
    if (!KEYS.includes(key)) return false
    const cfg = await readCfg()
    cfg[key] = val || ''
    await writeJson(cfgFile(), cfg)
    return val ? await apply(val) : { ok: true, msg: 'Sem troca de perfil.' }
  })

  // Garante que o DS4Windows esteja aberto (sem ele nenhum perfil, nem o "PC", funciona)
  function ensureRunning() {
    chain = chain.then(async () => {
      if (await isRunning()) return
      if (fs.existsSync(exe)) await startDs4()
    }).catch(() => {})
    return chain
  }

  // Fecha o DS4Windows (comando oficial "shutdown"; se não fechar, pede para fechar normalmente)
  function shutdown() {
    chain = chain.then(async () => {
      if (!(await isRunning())) return
      await new Promise((res) => {
        const c = spawn(cmdExe(), ['-command', 'shutdown'], { cwd: dir, stdio: 'ignore', windowsHide: true })
        const t = setTimeout(() => { try { c.kill() } catch {} res() }, 3000)
        c.on('error', () => { clearTimeout(t); res() })
        c.on('exit', () => { clearTimeout(t); res() })
      })
      await sleep(1500)
      if (await isRunning()) await new Promise((res) => execFile('taskkill', ['/IM', 'DS4Windows.exe', '/T'], { windowsHide: true }, () => res()))
    }).catch(() => {})
    return chain
  }

  return { apply, applyFor, ensureRunning, shutdown }
}
