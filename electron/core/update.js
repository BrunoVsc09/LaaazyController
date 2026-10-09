// Atualização pelo GitHub: qual é a última versão, se é mais nova, o que baixar e se foi o Bruno que
// assinou. Sem I/O (crypto aqui é só conta). Cada versão é uma release "vX.Y.Z" com o instalador, a
// impressão digital (SHA-256) e a assinatura Ed25519 de "versão + impressão digital" (.sig).
const crypto = require('crypto')
const REPO = 'BrunoVsc09/LaaazyController'
// Só baixa do repositório do Laaazy, por HTTPS (o GitHub redireciona para o armazenamento dele)
const DOWNLOAD_BASE = `https://github.com/${REPO}/releases/download/`
const LATEST_URL = `https://api.github.com/repos/${REPO}/releases/latest`
const VERSION = /^v?(\d+)\.(\d+)\.(\d+)$/
const SHA256 = /^([0-9a-f]{64})(\s+\S.*)?$/i

const parseVersion = (v) => {
  const m = VERSION.exec(String(v ?? '').trim())
  return m && m.slice(1, 4).map(Number)
}

function isNewer(current, latest) {
  const a = parseVersion(current)
  const b = parseVersion(latest)
  if (!a || !b) return false
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return b[i] > a[i]
  return false
}

// Mesmo nome que o package.json (build.nsis.artifactName) dá ao instalador
const setupName = (version) => `Laaazy-Setup-${version}-x64.exe`

// Da resposta do GitHub (releases/latest): o que oferecer, ou null se falta algo ou não é confiável
function pickRelease(release) {
  if (!release || release.draft || release.prerelease) return null
  const v = parseVersion(release.tag_name)
  if (!v) return null
  const version = v.join('.')
  const find = (name) => (release.assets || []).find((a) => a.name === name && String(a.browser_download_url).startsWith(DOWNLOAD_BASE))
  const setup = find(setupName(version))
  const sha = find(setupName(version) + '.sha256')
  const sig = find(setupName(version) + '.sig')
  if (!setup || !sha || !sig) return null
  return { version, setupName: setup.name, setupUrl: setup.browser_download_url, size: setup.size, shaUrl: sha.browser_download_url, sigUrl: sig.browser_download_url, page: release.html_url }
}

// Arquivo .sha256: só o código, ou "código  nome" (formato do sha256sum)
function parseSha256(text) {
  const m = SHA256.exec(String(text ?? '').trim())
  return m ? m[1].toLowerCase() : null
}

// O que o Bruno assina: a versão junto, para um instalador velho não voltar como se fosse novo
const signedMessage = (version, sha) => `laaazy-update\n${version}\n${sha}`

// Assinatura (base64, como no .sig) feita pela chave privada do Bruno? Sem chave no Laaazy: nunca
function verifyRelease({ version, sha, signature }, publicKeyPem) {
  if (!publicKeyPem || !signature) return false
  try {
    return crypto.verify(null, Buffer.from(signedMessage(version, sha)), publicKeyPem, Buffer.from(String(signature).trim(), 'base64'))
  } catch { return false }
}

module.exports = { isNewer, pickRelease, parseSha256, setupName, signedMessage, verifyRelease, LATEST_URL, REPO }
