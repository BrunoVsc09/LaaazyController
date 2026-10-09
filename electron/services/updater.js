// Atualização: ao abrir, o Laaazy pergunta ao GitHub se há versão nova; "Atualizar" baixa o
// instalador, confere a impressão digital (SHA-256 publicada junto) e só então roda o instalador.
// mode(): 'installer' (instalado pelo Setup), 'portable' (o .exe portátil) ou 'dev' (pnpm app)
const path = require('path')
const rules = require('../core/update')

const MISMATCH = 'O instalador baixado não confere com o publicado. Nada foi instalado; tente de novo mais tarde.'

function createUpdater({ currentVersion, mode, fetchJson, fetchText, download, hashFile, removeFile, tempDir, runInstaller, quit, openExternal }) {
  let offer = null // a release mais nova achada pelo check()
  let busy = null

  async function check() {
    offer = null
    if (mode() === 'dev') return { available: false }
    let release
    try { release = rules.pickRelease(await fetchJson(rules.LATEST_URL)) } catch { return { available: false } }
    if (!release || !rules.isNewer(currentVersion(), release.version)) return { available: false }
    offer = release
    return { available: true, version: release.version, canInstall: mode() === 'installer' }
  }

  async function installNow() {
    if (!offer) return { ok: false, msg: 'Não há atualização para instalar.' }
    // O portátil não tem instalação para atualizar: abre a página da versão
    if (mode() !== 'installer') { await openExternal(offer.page); return { ok: true, msg: '' } }
    const file = path.win32.join(tempDir(), offer.setupName)
    let expected
    try {
      await download(offer.setupUrl, file)
      expected = rules.parseSha256(await fetchText(offer.shaUrl))
    } catch (e) {
      return { ok: false, msg: `Não consegui baixar a atualização: ${e.message}` }
    }
    if (!expected || (await hashFile(file)) !== expected) {
      await removeFile(file)
      return { ok: false, msg: MISMATCH }
    }
    const err = await runInstaller(file)
    if (err) return { ok: false, msg: `Não consegui abrir o instalador: ${err}` }
    quit()
    return { ok: true, msg: '' }
  }

  // Dois "Atualizar" seguidos esperam o mesmo download
  function install() {
    busy ??= installNow().finally(() => { busy = null })
    return busy
  }

  return { check, install }
}

module.exports = { createUpdater }
