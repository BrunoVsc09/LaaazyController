// Equalizador do Windows pelo Equalizer APO: salva a escolha na hora e grava o arquivo
// do APO quando o usuário para de mexer (segurar ↑ no controle não vira 30 gravações).
const core = require('../core/equalizer')

const DELAY_MS = 150

const errorText = (code) => (code === 'EPERM' || code === 'EACCES'
  ? 'Sem permissão para gravar na pasta do Equalizer APO.'
  : `Não consegui gravar no Equalizer APO (${code}).`)

function createEqualizer({ findConfigDir, join, readText, writeText, settings, later = setTimeout, cancel = clearTimeout }) {
  let error = ''
  let pending = null

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

  return { status, set, start }
}

module.exports = { createEqualizer }
