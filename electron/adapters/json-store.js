// Leitura e escrita de arquivos JSON de configuração sem perder dados.
//
// - Arquivo corrompido é guardado como .bak antes de voltar ao padrão (senão a
//   próxima gravação apagaria o conteúdo antigo sem aviso).
// - Toda gravação é atômica: escreve em .tmp e só então renomeia por cima.
const fs = require('fs')
const fsp = fs.promises
const path = require('path')

// Avisos ficam aqui para a tela poder mostrar depois (canal store:warnings)
const warnings = []
const warn = (msg) => { warnings.push({ at: Date.now(), msg }); console.warn('[store]', msg) }
const takeWarnings = () => warnings.splice(0, warnings.length)

function backupCorrupt(file) {
  const bak = file + '.bak'
  try {
    fs.copyFileSync(file, bak)
    warn(`"${path.basename(file)}" estava corrompido. Guardei uma cópia em "${path.basename(bak)}" e recomecei do padrão.`)
  } catch {
    warn(`"${path.basename(file)}" estava corrompido e não consegui fazer backup.`)
  }
}

// Um JSON válido mas do tipo errado (lista onde se espera objeto, null, número) também é corrupção
function parse(file, raw, fallback) {
  let v
  try { v = JSON.parse(raw) } catch { v = undefined }
  const ok = v !== null && typeof v === 'object' && Array.isArray(v) === Array.isArray(fallback)
  if (ok) return v
  backupCorrupt(file)
  return fallback
}

// Arquivo ausente é o primeiro uso: devolve o padrão sem reclamar
function readFailed(file, e, fallback) {
  if (e.code !== 'ENOENT') warn(`Não consegui ler "${path.basename(file)}": ${e.message}`)
  return fallback
}

function writeFailed(file, tmp, e, unlink) {
  warn(`Não consegui salvar "${path.basename(file)}": ${e.message}`)
  try { unlink(tmp) } catch {}
  return false
}

async function readJson(file, fallback) {
  let raw
  try { raw = await fsp.readFile(file, 'utf8') } catch (e) { return readFailed(file, e, fallback) }
  return parse(file, raw, fallback)
}

function readJsonSync(file, fallback) {
  let raw
  try { raw = fs.readFileSync(file, 'utf8') } catch (e) { return readFailed(file, e, fallback) }
  return parse(file, raw, fallback)
}

async function writeJson(file, data) {
  const tmp = file + '.tmp'
  try {
    await fsp.mkdir(path.dirname(file), { recursive: true })
    await fsp.writeFile(tmp, JSON.stringify(data, null, 2), 'utf8')
    await fsp.rename(tmp, file)
    return true
  } catch (e) {
    return writeFailed(file, tmp, e, fs.unlinkSync)
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
    return writeFailed(file, tmp, e, fs.unlinkSync)
  }
}

module.exports = { readJson, readJsonSync, writeJson, writeJsonSync, takeWarnings }
