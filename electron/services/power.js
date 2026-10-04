// Botão Energia: fechar o app, suspender ou desligar o PC (os dois últimos com confirmação).
const { COMMANDS, ACTIONS, needsConfirm } = require('../core/power')

const LABEL = { shutdown: 'desligar o PC', suspend: 'suspender o PC' }

function createPower({ exec, quit, setLogin, getLogin }) {
  async function run(action, confirmed = false) {
    if (!ACTIONS.includes(action)) return { ok: false, msg: 'Ação desconhecida.' }
    if (needsConfirm(action) && confirmed !== true) return { ok: false, confirm: true, msg: `Confirme para ${LABEL[action]}.` }
    if (action === 'quit') { quit(); return { ok: true } }
    const { cmd, args } = COMMANDS[action]
    const err = await exec(cmd, args)
    return err ? { ok: false, msg: 'Não consegui: ' + err } : { ok: true }
  }
  return { run, openAtLogin: () => getLogin(), setOpenAtLogin: (on) => setLogin(!!on) }
}

module.exports = { createPower }
