// Quais programas o atalho "fechar o que está na frente" pode fechar. Sem I/O.

// Nunca fecha estes: o próprio app, o Windows, o Steam e o Laaazy-pad (perfis do controle)
const PROTECTED = new Set(['explorer', 'steam', 'steamwebhelper', 'laaazypad', 'dwm', 'csrss', 'winlogon',
  'searchhost', 'searchapp', 'shellexperiencehost', 'startmenuexperiencehost', 'applicationframehost',
  'textinputhost', 'lockapp', 'sihost', 'electron', 'lazy-ps4', 'lazy ps4', 'laaazy'])

// Quem abriu o Laaazy (terminal do "pnpm app", app do Claude...): fechar um deles com /T
// levaria o Laaazy junto. table: [{ pid, ppid }] de todos os processos.
function ancestorsOf(table, pid) {
  const parent = new Map(table.map((p) => [p.pid, p.ppid]))
  const out = []
  let cur = parent.get(pid)
  while (cur && !out.includes(cur) && cur !== pid) {
    out.push(cur)
    cur = parent.get(cur)
  }
  return out
}

function shouldClose({ pid, name }, { selfPid, ownPids, ancestorPids = [] }) {
  if (!pid || pid === selfPid || ownPids.includes(pid) || ancestorPids.includes(pid)) return false
  return !PROTECTED.has(String(name).toLowerCase())
}

// "pid ppid" por linha (Get-CimInstance Win32_Process) → [{ pid, ppid }]
function parseProcessTable(text) {
  const out = []
  for (const line of String(text || '').split(/\r?\n/)) {
    const m = /^(\d+) (\d+)/.exec(line.trim())
    if (m) out.push({ pid: Number(m[1]), ppid: Number(m[2]) })
  }
  return out
}

module.exports = { shouldClose, ancestorsOf, parseProcessTable, PROTECTED }
