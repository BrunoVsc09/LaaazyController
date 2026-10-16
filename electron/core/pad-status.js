// Bateria do controle (lida pelo Laaazy-pad) e quando avisar que está baixa. Sem I/O.
// Contrato: Query.1.Battery → "<porcentagem> <estado>" ou "nenhum" (docs/CONTRATO.md do Laaazy-pad).

const { PAD_IDLE_MINUTES } = require('../../shared/idle-options')

const STATES = ['descarregando', 'carregando', 'carregado', 'cabo', 'desconhecido']
const LEVELS = [20, 10] // avisa uma vez em cada nível

// { percent, state } (percent -1 = o controle não informa) ou null
function parseBattery(text) {
  const m = /^(-1|\d{1,3}) ([a-z]+)$/.exec(String(text || '').trim())
  if (!m || !STATES.includes(m[2]) || Number(m[1]) > 100) return null
  return { percent: Number(m[1]), state: m[2] }
}

// warned = o menor nível já avisado (null = nenhum). Carregar ou passar de 20% zera.
function batteryAlert(battery, warned) {
  if (!battery) return { alert: null, warned }
  if (battery.state !== 'descarregando' || battery.percent < 0 || battery.percent > LEVELS[0]) return { alert: null, warned: null }
  const level = Math.min(...LEVELS.filter((l) => battery.percent <= l))
  if (warned !== null && level >= warned) return { alert: null, warned }
  return { alert: level, warned: level }
}

const alertText = (level) => (level <= 10
  ? `Bateria do controle em ${level}%: conecte o cabo para não desligar.`
  : `Bateria do controle em ${level}%. Conecte o cabo quando puder.`)

module.exports = { parseBattery, batteryAlert, alertText, PAD_IDLE_MINUTES }
