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

module.exports = { spawnDetached, killTree }
