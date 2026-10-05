// Ações do botão Energia e "abrir junto com o Windows". Sem I/O.

// Observação: no Windows, SetSuspendState hiberna em vez de suspender se a hibernação estiver ligada
// Desligar agendado fica com o próprio Windows (shutdown /t): vale mesmo com o Laaazy fechado
const HOUR = 3600
const DELAY = { shutdown: 0, shutdown_3h: 3 * HOUR, shutdown_2h: 2 * HOUR }
const COMMANDS = {
  shutdown: { cmd: 'shutdown', args: ['/s', '/t', '0'] },
  shutdown_3h: { cmd: 'shutdown', args: ['/s', '/t', String(DELAY.shutdown_3h)] },
  shutdown_2h: { cmd: 'shutdown', args: ['/s', '/t', String(DELAY.shutdown_2h)] },
  shutdown_cancel: { cmd: 'shutdown', args: ['/a'] },
  suspend: { cmd: 'rundll32.exe', args: ['powrprof.dll,SetSuspendState', '0', '1', '0'] },
}
const ACTIONS = ['quit', ...Object.keys(COMMANDS)]

const needsConfirm = (action) => action in COMMANDS
const delaySeconds = (action) => DELAY[action] || 0

const two = (n) => String(n).padStart(2, '0')
const clockText = (d) => `${two(d.getHours())}:${two(d.getMinutes())}`

// O .exe portátil roda de uma pasta temporária: no boot, o Windows precisa abrir o .exe de verdade
function loginItemFor({ isPackaged, execPath, portableFile, appPath }) {
  if (!isPackaged) return { path: execPath, args: [appPath] }
  return { path: portableFile || execPath, args: [] }
}

module.exports = { COMMANDS, ACTIONS, needsConfirm, delaySeconds, clockText, loginItemFor }
