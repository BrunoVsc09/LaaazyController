// Leitura e escrita de arquivos JSON de configuração sem perder dados.
//
// O problema que isto resolve: antes, cada arquivo era lido com
// `try { JSON.parse(...) } catch { return {} }`. Se o JSON corrompesse (queda de
// energia no meio de uma gravação, por exemplo), a leitura devolvia o padrão em
// silêncio e a PRÓXIMA gravação apagava o arquivo inteiro. Você perdia os jogos
// adicionados à mão, os perfis e os caminhos salvos sem nunca ver um aviso.
//
// Agora: se o arquivo estiver corrompido ele é guardado como .bak antes de
// qualquer coisa, e toda gravação é atômica (escreve em .tmp e só então troca).
const fs = require('fs')
const fsp = fs.promises
const path = require('path')

// Avisos ficam aqui para a tela poder mostrar depois (ver ipc 'store:warnings')
const warnings = []
const warn = (msg) => { warnings.push({ at: Date.now(), msg }); console.warn('[store]', msg) }

function backupCorrupt(file) {
  const bak = file + '.bak'
  try {
    fs.copyFileSync(file, bak)
    warn(`"${path.basename(file)}" estava corrompido. Guardei uma cópia em "${path.basename(bak)}" e recomecei do padrão.`)
  } catch {
    warn(`"${path.basename(file)}" estava corrompido e não consegui fazer backup.`)
  }
}

// Lê um JSON. Se não existir, devolve o padrão sem reclamar (é o primeiro uso).
// Se existir mas estiver quebrado, faz backup antes de devolver o padrão.
async function readJson(file, fallback) {
  let raw
  try {
    raw = await fsp.readFile(file, 'utf8')
  } catch (e) {
    if (e.code !== 'ENOENT') warn(`Não consegui ler "${path.basename(file)}": ${e.message}`)
    return fallback
  }
  try {
    const v = JSON.parse(raw)
    // Um JSON válido mas do tipo errado (array onde se espera objeto) também é corrupção
    if (Array.isArray(fallback) !== Array.isArray(v) || v === null || typeof v !== 'object') {
      backupCorrupt(file)
      return fallback
    }
    return v
  } catch {
    backupCorrupt(file)
    return fallback
  }
}

function readJsonSync(file, fallback) {
  let raw
  try {
    raw = fs.readFileSync(file, 'utf8')
  } catch (e) {
    if (e.code !== 'ENOENT') warn(`Não consegui ler "${path.basename(file)}": ${e.message}`)
    return fallback
  }
  try {
    const v = JSON.parse(raw)
    if (Array.isArray(fallback) !== Array.isArray(v) || v === null || typeof v !== 'object') {
      backupCorrupt(file)
      return fallback
    }
    return v
  } catch {
    backupCorrupt(file)
    return fallback
  }
}

// Escrita atômica: grava em .tmp e só então renomeia por cima do original.
// Se o computador desligar no meio, o arquivo antigo continua intacto.
async function writeJson(file, data) {
  const tmp = file + '.tmp'
  try {
    await fsp.mkdir(path.dirname(file), { recursive: true })
    await fsp.writeFile(tmp, JSON.stringify(data, null, 2), 'utf8')
    await fsp.rename(tmp, file)
    return true
  } catch (e) {
    warn(`Não consegui salvar "${path.basename(file)}": ${e.message}`)
    try { await fsp.unlink(tmp) } catch {}
    return false
  }
}

function writeJsonSync(file, data) {
  const tmp = file + '.tmp'
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8')
    fs.renameSync(tmp, file)
    return true
  } catch (e) {
    warn(`Não consegui salvar "${path.basename(file)}": ${e.message}`)
    try { fs.unlinkSync(tmp) } catch {}
    return false
  }
}

const takeWarnings = () => warnings.splice(0, warnings.length)

module.exports = { readJson, readJsonSync, writeJson, writeJsonSync, takeWarnings }
