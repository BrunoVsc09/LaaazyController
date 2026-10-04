// Quais programas o atalho "fechar o que está na frente" pode fechar. Sem I/O.

// Nunca fecha estes: o próprio app, o Windows, o Steam e o DS4Windows
const PROTECTED = new Set(['explorer', 'steam', 'steamwebhelper', 'ds4windows', 'dwm', 'csrss', 'winlogon',
  'searchhost', 'searchapp', 'shellexperiencehost', 'startmenuexperiencehost', 'applicationframehost',
  'textinputhost', 'lockapp', 'sihost', 'electron', 'lazy-ps4', 'lazy ps4'])

function shouldClose({ pid, name }, { selfPid, ownPids }) {
  if (!pid || pid === selfPid || ownPids.includes(pid)) return false
  return !PROTECTED.has(String(name).toLowerCase())
}

module.exports = { shouldClose, PROTECTED }
