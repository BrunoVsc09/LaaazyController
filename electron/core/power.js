// Ações do botão Energia e "abrir junto com o Windows". Sem I/O.

// Observação: no Windows, SetSuspendState hiberna em vez de suspender se a hibernação estiver ligada
const COMMANDS = {
  shutdown: { cmd: 'shutdown', args: ['/s', '/t', '0'] },
  suspend: { cmd: 'rundll32.exe', args: ['powrprof.dll,SetSuspendState', '0', '1', '0'] },
}
const ACTIONS = ['quit', ...Object.keys(COMMANDS)]

const needsConfirm = (action) => action in COMMANDS

// O .exe portátil roda de uma pasta temporária: no boot, o Windows precisa abrir o .exe de verdade
function loginItemFor({ isPackaged, execPath, portableFile, appPath }) {
  if (!isPackaged) return { path: execPath, args: [appPath] }
  return { path: portableFile || execPath, args: [] }
}

module.exports = { COMMANDS, ACTIONS, needsConfirm, loginItemFor }
