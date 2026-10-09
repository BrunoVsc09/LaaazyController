// Rede e disco da atualização: lê a release no GitHub, baixa o instalador para um arquivo,
// calcula o SHA-256 e abre o instalador. Sem regra de negócio (ela fica em core/update e services/updater).
const fs = require('fs')
const crypto = require('crypto')
const { Readable } = require('stream')
const { pipeline } = require('stream/promises')

// Instalador NSIS do electron-builder: /S sem janelas (dá para usar só com o controle),
// --updated avisa que é atualização e --force-run abre o Laaazy no fim
const INSTALLER_ARGS = ['/S', '--updated', '--force-run']
const HEADERS = { 'User-Agent': 'Laaazy', Accept: 'application/vnd.github+json' }

function createGithubReleases({ fetch = globalThis.fetch } = {}) {
  async function get(url) {
    const res = await fetch(url, { headers: HEADERS })
    if (!res.ok) throw new Error(`O GitHub respondeu com erro ${res.status}.`)
    return res
  }
  const fetchJson = async (url) => (await get(url)).json()
  const fetchText = async (url) => (await get(url)).text()

  // Grava num .part e só renomeia no fim: nunca sobra instalador pela metade com o nome certo
  async function download(url, file) {
    const res = await get(url)
    const part = file + '.part'
    try {
      await pipeline(Readable.fromWeb(res.body), fs.createWriteStream(part))
      await fs.promises.rename(part, file)
    } catch (e) {
      await fs.promises.rm(part, { force: true })
      throw e
    }
  }

  async function hashFile(file) {
    const hash = crypto.createHash('sha256')
    await pipeline(fs.createReadStream(file), hash)
    return hash.digest('hex')
  }

  const removeFile = (file) => fs.promises.rm(file, { force: true })

  return { fetchJson, fetchText, download, hashFile, removeFile }
}

module.exports = { createGithubReleases, INSTALLER_ARGS }
