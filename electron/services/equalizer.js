// Equalizador do Windows pelo Equalizer APO: salva a escolha na hora e grava o arquivo
// do APO quando o usuário para de mexer (segurar ↑ no controle não vira 30 gravações).
const core = require('../core/equalizer')

const DELAY_MS = 150

const errorText = (code) => (code === 'EPERM' || code === 'EACCES'
  ? 'Sem permissão para gravar na pasta do Equalizer APO.'
  : `Não consegui gravar no Equalizer APO (${code}).`)

const INSTALLED = 'Equalizer APO instalado. Na janela que abriu, marque a sua saída de som e clique em OK (com o mouse); se o Windows pedir, reinicie o PC.'
const MISMATCH = 'O instalador baixado não confere com o esperado. Nada foi instalado; tente de novo mais tarde.'

// Instalar (baixar na hora): download, hashFile, removeFile e tempDir vêm do adapter da atualização;
// runElevated roda como administrador (o Windows pergunta "Sim/Não")
function createEqualizer({ findConfigDir, join, readText, writeText, settings, later = setTimeout, cancel = clearTimeout,
  tempDir, download, hashFile, removeFile, runElevated }) {
  let error = ''
  let pending = null
  let installing = null

  const saved = () => {
    const s = settings.get('equalizer')
    return core.validState(s) ? s : core.FLAT
  }

  // Garante o Include no config.txt do usuário e grava o nosso arquivo
  async function apply(state) {
    const dir = await findConfigDir()
    if (!dir) return
    const main = join(dir, 'config.txt')
    const text = await readText(main)
    const included = core.withInclude(text)
    const results = []
    if (included !== text) results.push(await writeText(main, included))
    results.push(await writeText(join(dir, core.APP_FILE), core.render(state)))
    const failed = results.find((r) => !r.ok)
    error = failed ? errorText(failed.code) : ''
  }

  async function status() {
    return { installed: !!(await findConfigDir()), state: saved(), error }
  }

  async function set(state) {
    if (!core.validState(state)) return { ok: false, msg: 'Ajuste inválido.' }
    settings.set('equalizer', state)
    if (pending) cancel(pending)
    pending = later(() => { pending = null; return apply(state) }, DELAY_MS)
    return { ok: true }
  }

  const start = () => apply(saved())

  async function installNow() {
    if (await findConfigDir()) return { ok: true, msg: 'O Equalizer APO já está instalado.' }
    const setup = core.APO_SETUP
    const file = join(tempDir(), setup.fileName)
    try {
      await download(setup.url, file)
    } catch (e) {
      return { ok: false, msg: `Não consegui baixar o Equalizer APO: ${e.message}` }
    }
    if ((await hashFile(file)) !== setup.sha256) {
      await removeFile(file)
      return { ok: false, msg: MISMATCH }
    }
    const r = await runElevated(file, [...setup.args])
    await removeFile(file)
    if (r.canceled) return { ok: false, msg: 'Instalação cancelada no aviso do Windows. Nada foi instalado.' }
    if (!r.ok) return { ok: false, msg: `O instalador do Equalizer APO terminou com erro (código ${r.code}).` }
    if (!(await findConfigDir())) return { ok: false, msg: 'O instalador terminou, mas o Equalizer APO não apareceu. Tente instalar de novo.' }
    await apply(saved())
    return { ok: true, msg: INSTALLED }
  }

  // Dois "Instalar" seguidos esperam a mesma instalação
  function install() {
    installing ??= installNow().finally(() => { installing = null })
    return installing
  }

  return { status, set, start, install }
}

module.exports = { createEqualizer }
