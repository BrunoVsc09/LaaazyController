// Abre e fecha processos do Windows.
const path = require('path')
const { spawn, execFile } = require('child_process')

// Abre um programa solto do app. Devolve '' se subiu, ou a mensagem de erro.
// Se em 400ms nenhum erro chegou, o processo subiu.
function spawnDetached(exe, args = []) {
  return new Promise((res) => {
    let c
    try {
      c = spawn(exe, args, { cwd: path.dirname(exe), detached: true, stdio: 'ignore' })
    } catch (e) { return res(e.message) }
    c.on('error', (e) => res(e.message))
    c.unref()
    setTimeout(() => res(''), 400)
  })
}

// Fecha o processo e os filhos; force = sem dar chance de salvar
function killTree(pid, force) {
  const args = ['/PID', String(pid), '/T']
  if (force) args.push('/F')
  execFile('taskkill', args, { windowsHide: true }, () => {})
}

// "pid ppid" de todos os processos (para saber quem abriu o Laaazy); '' se falhar
const TABLE_CMD = 'Get-CimInstance Win32_Process | ForEach-Object { "$($_.ProcessId) $($_.ParentProcessId)" }'
function processTable() {
  return new Promise((res) => execFile('powershell.exe', ['-NoLogo', '-NoProfile', '-NonInteractive', '-Command', TABLE_CMD],
    { windowsHide: true, timeout: 20000, maxBuffer: 4 * 1024 * 1024 }, (e, out) => res(e ? '' : String(out))))
}

// Roda um programa como administrador (o Windows mostra o aviso "Sim/Não") e espera terminar.
// Texto em aspas simples do PowerShell: ' vira ''. "Não" no aviso = código 1223 (ERROR_CANCELLED)
const psQuote = (s) => `'${String(s).replaceAll("'", "''")}'`
function elevatedCommand(exe, args) {
  const argList = args.length ? ` -ArgumentList ${psQuote(args.join(' '))}` : ''
  return [
    `try { $p = Start-Process -FilePath ${psQuote(exe)}${argList} -Verb RunAs -Wait -PassThru; exit $p.ExitCode }`,
    'catch { $e = $_.Exception; while ($e) { if ($e.NativeErrorCode -eq 1223) { exit 1223 }; $e = $e.InnerException }; exit 1 }',
  ].join(' ')
}
const elevatedResult = (code) => ({ ok: code === 0, canceled: code === 1223, code })

// Sem tempo limite: espera a pessoa responder o aviso e o instalador terminar
function runElevated(exe, args = []) {
  return new Promise((res) => execFile('powershell.exe', ['-NoLogo', '-NoProfile', '-NonInteractive', '-Command', elevatedCommand(exe, args)],
    { windowsHide: true }, (e) => res(elevatedResult(e ? (typeof e.code === 'number' ? e.code : -1) : 0))))
}

module.exports = { spawnDetached, killTree, processTable, runElevated, elevatedCommand, elevatedResult }
