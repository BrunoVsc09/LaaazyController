// Regras para jogos adicionados à mão (pasta ou .exe). Sem I/O.
const path = require('path')

const BAD_EXE = /unins|setup|crash|redist|dxsetup|dotnet|updater|helper|easyanticheat|eac_|cef|benchmark|notification|report/i
const SKIP_DIR = /^(_redist|redist|__installer|directx|engine|\.)/i

const isGameExe = (name) => /\.exe$/i.test(name) && !BAD_EXE.test(name)
const isSkippedDir = (name) => SKIP_DIR.test(name)

// O id vem do caminho em minúsculas: o mesmo arquivo nunca entra duas vezes
const customGame = (exe, name = path.basename(exe).replace(/\.[^.]+$/, '')) =>
  ({ id: 'pc:' + exe.toLowerCase(), name, exe })

module.exports = { isGameExe, isSkippedDir, customGame }
