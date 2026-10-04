// Consulta o registro do Windows (reg.exe).
const { execFile } = require('child_process')

const regQuery = (args) =>
  new Promise((res) => execFile('reg', ['query', ...args], { windowsHide: true }, (e, out) => res(e ? '' : String(out))))

// Caminho registrado em "App Paths" para um .exe (ex.: msedge.exe), ou null
async function regAppPath(exeName) {
  const out = await regQuery([`HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\${exeName}`, '/ve'])
  const m = out.match(/REG_SZ\s+(.+)/)
  return m ? m[1].trim() : null
}

// Valor de texto de uma chave (ex.: SteamPath), ou null
async function regValue(key, name) {
  const out = await regQuery([key, '/v', name])
  const m = out.match(new RegExp(`${name}\\s+REG_SZ\\s+(.+)`))
  return m ? m[1].trim() : null
}

module.exports = { regQuery, regAppPath, regValue }
