// Acha o .exe de um programa: caminho salvo → caminhos padrão → registro do Windows.
// Se não achar, pode perguntar a pasta (choose) e salvar a escolha.
const path = require('path')
const { resolveExeIn } = require('../core/paths')

// Caminho dentro de uma variável de ambiente; se ela não existir, nada (evita caminho relativo)
const under = (env, name, ...parts) => (env[name] ? path.join(env[name], ...parts) : null)

const PROGRAMS = {
  edge: {
    label: 'Microsoft Edge', exe: 'msedge.exe', setting: 'edgePath',
    defaults: (env) => [
      under(env, 'ProgramFiles(x86)', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
      under(env, 'ProgramFiles', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    ],
  },
  chrome: {
    label: 'Google Chrome', exe: 'chrome.exe', setting: 'chromePath',
    defaults: (env) => [
      under(env, 'ProgramFiles', 'Google', 'Chrome', 'Application', 'chrome.exe'),
      under(env, 'ProgramFiles(x86)', 'Google', 'Chrome', 'Application', 'chrome.exe'),
      under(env, 'LOCALAPPDATA', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    ],
  },
  firefox: {
    label: 'Firefox', exe: 'firefox.exe', setting: 'firefoxPath',
    defaults: (env) => [
      under(env, 'ProgramFiles', 'Mozilla Firefox', 'firefox.exe'),
      under(env, 'ProgramFiles(x86)', 'Mozilla Firefox', 'firefox.exe'),
    ],
  },
  hydra: {
    label: 'Hydra', exe: 'Hydra.exe', setting: 'hydraPath',
    defaults: (env) => [under(env, 'LOCALAPPDATA', 'Programs', 'Hydra', 'Hydra.exe')],
  },
  ds4windows: {
    label: 'DS4Windows', exe: 'DS4Windows.exe', setting: 'ds4Path',
    defaults: (env) => [
      under(env, 'USERPROFILE', 'Downloads', 'win-x64', 'DS4Windows.exe'),
      under(env, 'LOCALAPPDATA', 'DS4Windows', 'DS4Windows.exe'),
      under(env, 'ProgramFiles', 'DS4Windows', 'DS4Windows.exe'),
    ],
  },
}

function createExeLocator({ settings, exists, regAppPath, chooseDir, showError, env = process.env }) {
  async function find(key) {
    const p = PROGRAMS[key]
    if (!p) return null
    const saved = resolveExeIn(settings.get(p.setting), p.exe, exists)
    if (saved) return saved
    for (const c of p.defaults(env)) if (c && exists(c)) return c
    const reg = await regAppPath(p.exe)
    return reg && exists(reg) ? reg : null
  }

  async function choose(key) {
    const p = PROGRAMS[key]
    if (!p || !chooseDir) return null
    const dir = await chooseDir(`Escolha a pasta do ${p.label} (onde fica o ${p.exe})`)
    if (!dir) return null
    const exe = resolveExeIn(dir, p.exe, exists)
    if (!exe) {
      showError(`${p.label} não encontrado`, `Não achei o ${p.exe} nessa pasta. Escolha a pasta que contém o ${p.exe}.`)
      return null
    }
    settings.set(p.setting, dir)
    return exe
  }

  const findOrChoose = async (key) => (await find(key)) || (await choose(key))

  return { find, choose, findOrChoose, programs: PROGRAMS }
}

module.exports = { createExeLocator, PROGRAMS }
