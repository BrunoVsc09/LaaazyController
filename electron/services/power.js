// Botão Energia: fechar o app, suspender, desligar agora ou daqui a 2/3 horas e cancelar o
// desligamento. Tudo que mexe no PC pergunta antes "você tem certeza?".
const { COMMANDS, ACTIONS, needsConfirm, delaySeconds, clockText } = require('../core/power')

const SCHEDULED = ['shutdown_3h', 'shutdown_2h']

function createPower({ exec, quit, setLogin, getLogin, now = Date.now }) {
  const at = (action) => clockText(new Date(now() + delaySeconds(action) * 1000))

  function question(action) {
    if (action === 'suspend') return 'Você tem certeza que quer suspender o PC?'
    if (action === 'shutdown_cancel') return 'Você tem certeza que quer cancelar o desligamento agendado?'
    if (SCHEDULED.includes(action)) return `Você tem certeza que quer desligar o PC daqui a ${delaySeconds(action) / 3600} horas (às ${at(action)})?`
    return 'Você tem certeza que quer desligar o PC agora?'
  }

  const runCommand = (action) => exec(COMMANDS[action].cmd, COMMANDS[action].args)

  async function run(action, confirmed = false) {
    if (!ACTIONS.includes(action)) return { ok: false, msg: 'Ação desconhecida.' }
    if (needsConfirm(action) && confirmed !== true) return { ok: false, confirm: true, msg: question(action) }
    if (action === 'quit') { quit(); return { ok: true } }
    if (action === 'shutdown_cancel') {
      return (await runCommand(action)) ? { ok: false, msg: 'Não havia nenhum desligamento agendado.' } : { ok: true, msg: 'Desligamento cancelado.' }
    }
    // Um agendamento novo substitui o anterior (o Windows recusa dois ao mesmo tempo)
    if (SCHEDULED.includes(action)) await runCommand('shutdown_cancel')
    const err = await runCommand(action)
    if (err) return { ok: false, msg: 'Não consegui: ' + err }
    if (SCHEDULED.includes(action)) return { ok: true, msg: `O PC vai desligar às ${at(action)}. Para desistir: Energia → Cancelar o desligamento.` }
    return { ok: true }
  }
  return { run, openAtLogin: () => getLogin(), setOpenAtLogin: (on) => setLogin(!!on) }
}

module.exports = { createPower }
