// Interpreta o components.status() do Electron castlabs. Sem I/O.
const MISSING = 'Widevine não instalado. Vídeos com proteção (Netflix, Prime...) não vão tocar dentro do app.'

function widevineStatus(status) {
  const entry = Object.values(status || {}).find((c) => c && /widevine/i.test(c.title || ''))
  if (!entry || !entry.version) return { installed: false, version: '', msg: MISSING }
  return { installed: true, version: entry.version, msg: `Widevine instalado (versão ${entry.version}).` }
}

module.exports = { widevineStatus }
