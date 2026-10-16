// Controle: bateria (ícone no topo e aviso de bateria baixa) e o tempo parado, lidos do Laaazy-pad
// de tempos em tempos. Manda o tempo para desligar o controle parado (SetIdle) quando o Laaazy-pad
// aparece aberto, porque ele não guarda o valor e começa sempre em 10 min.
const { parseBattery, batteryAlert, alertText } = require('../core/pad-status')

// send({ battery, alert }) → tela; notify(texto) → notificação do Windows (Laaazy escondido)
function createPadStatus({ cli, getExe, minutes, send, notify, focused, now = Date.now }) {
  let running = false
  let warned = null
  let idle = null
  let idleAt = 0
  let busy = false

  async function read() {
    const exe = await getExe()
    const seconds = exe ? await cli.queryIdle(exe) : null
    if (seconds !== null && !running) await cli.setIdle(exe, minutes())
    running = seconds !== null
    ;[idle, idleAt] = [seconds, now()]
    const battery = running ? parseBattery(await cli.queryBattery(exe)) : null
    const a = batteryAlert(battery, warned)
    warned = a.warned
    const alert = a.alert ? alertText(a.alert) : ''
    send({ battery, alert })
    if (alert && !focused()) notify(alert)
  }

  async function tick() {
    if (busy) return
    busy = true
    try { await read() } finally { busy = false }
  }

  // Segundos sem ninguém usar o controle agora (null = Laaazy-pad fechado ou antigo)
  const idleNow = () => (idle === null ? null : idle + (now() - idleAt) / 1000)

  async function setMinutes(m) {
    const exe = running ? await getExe() : null
    if (exe) await cli.setIdle(exe, m)
  }

  return { tick, idleNow, setMinutes }
}

module.exports = { createPadStatus }
