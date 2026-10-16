// Pasta e arquivos do Equalizer APO (registro + disco). Sem regra de negócio.
const fsp = require('fs').promises
const path = require('path')
const { regValue } = require('./registry')

const APO_KEY = 'HKLM\\SOFTWARE\\EqualizerAPO'

const isDir = (p) => fsp.stat(p).then((s) => s.isDirectory(), () => false)
const isFile = (p) => fsp.stat(p).then((s) => s.isFile(), () => false)

// Pasta config do APO (onde fica o config.txt), ou null se não estiver instalado.
// O desinstalador deixa a chave do registro, a pasta config e DLLs em uso; o Uninstall.exe some
async function findConfigDir(readReg = regValue) {
  const installPath = await readReg(APO_KEY, 'InstallPath')
  if (!installPath || !(await isFile(path.join(installPath, 'Uninstall.exe')))) return null
  const configPath = await readReg(APO_KEY, 'ConfigPath')
  if (configPath && (await isDir(configPath))) return configPath
  const fallback = path.join(installPath, 'config')
  return (await isDir(fallback)) ? fallback : null
}

// Arquivo ausente vira texto vazio (primeiro uso)
const readText = (file) => fsp.readFile(file, 'utf8').catch(() => '')

// No Windows a troca do .tmp pelo arquivo falha por um instante quando outro programa (antivírus,
// o próprio APO relendo) segura um dos dois: esses erros passam sozinhos, então tenta de novo
const TRANSIENT = new Set(['EPERM', 'EACCES', 'EBUSY'])
const TRIES = 6

async function renameRetry(from, to, rename, waitMs) {
  for (let i = 1; ; i++) {
    try {
      return await rename(from, to)
    } catch (e) {
      if (!TRANSIENT.has(e.code) || i >= TRIES) throw e
      await new Promise((r) => setTimeout(r, waitMs * i))
    }
  }
}

// Gravação atômica: o APO relê o arquivo a cada mudança e nunca pode pegar um pela metade
async function writeText(file, text, { rename = fsp.rename, waitMs = 50 } = {}) {
  const tmp = file + '.tmp'
  try {
    await fsp.writeFile(tmp, text, 'utf8')
    await renameRetry(tmp, file, rename, waitMs)
    return { ok: true }
  } catch (e) {
    await fsp.unlink(tmp).catch(() => {})
    return { ok: false, code: e.code || 'ERRO' }
  }
}

module.exports = { APO_KEY, findConfigDir, readText, writeText }
