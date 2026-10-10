// pnpm release: depois do pnpm dist, prepara em dist/release-vX.Y.Z o que sobe na release do GitHub:
// o instalador, o .sha256 (o Laaazy confere o download com ele) e as notas (do CHANGELOG).
// Não publica nada: quem cria a release no GitHub é o Bruno (sem token no projeto).
const fs = require('fs')
const os = require('os')
const path = require('path')
const crypto = require('crypto')
const { signedMessage, verifyRelease } = require('../electron/core/update')

const ROOT = path.join(__dirname, '..')

// Trecho "## X.Y.Z — data" do CHANGELOG, sem o título, até a próxima versão
function changesFor(changelog, version) {
  const lines = changelog.replace(/\r\n/g, '\n').split('\n')
  const start = lines.findIndex((l) => new RegExp(`^## ${version.replace(/\./g, '\\.')} — \\d{4}-\\d{2}-\\d{2}$`).test(l))
  if (start < 0) throw new Error(`O CHANGELOG não tem a seção "## ${version} — data".`)
  const end = lines.findIndex((l, i) => i > start && l.startsWith('## '))
  return lines.slice(start + 1, end < 0 ? undefined : end).join('\n').trim()
}

// Chave privada das atualizações: na pasta do usuário, fora do projeto (nunca no GitHub)
const keyPath = (env = process.env, home = os.homedir()) => env.LAAAZY_RELEASE_KEY || path.join(home, '.laaazy', 'release-key.pem')
// Assinatura Ed25519 (base64) de "versão + impressão digital", que o Laaazy confere antes de instalar
const signatureFor = (privateKeyPem, version, sha) =>
  crypto.sign(null, Buffer.from(signedMessage(version, sha)), privateKeyPem).toString('base64')
// electron/core/release-key.js com a chave pública (gerado pelo pnpm release-key)
const keyModule = (publicKeyPem) =>
  `// Chave pública das atualizações (gerada por pnpm release-key). A privada fica só no PC do Bruno.\nmodule.exports = { RELEASE_PUBLIC_KEY: ${JSON.stringify(publicKeyPem)} }\n`

const setupOf = (version) => `Laaazy-Setup-${version}-x64.exe`
const portableOf = (version) => `Laaazy-${version}-x64-portatil.exe`
const shaFile = (sha, name) => `${sha}  ${name}\n`

function releaseNotes({ version, changes, sha }) {
  return `## Download

| Arquivo | Para quem |
|---|---|
| **${setupOf(version)}** | Instalador (recomendado). Windows 10 e 11, 64 bits. Não pede administrador. Quem já tem o Laaazy instalado recebe esta versão pelo aviso de atualização. |
| **${portableOf(version)}** | Versão portátil, sem instalar (não se atualiza sozinha). |

> O **Laaazy-pad** (perfis do controle e o botão PS, para qualquer controle: DualShock, 8BitDo, Xbox…) já vem junto e abre com o Laaazy.

> O instalador não tem assinatura digital paga. Se o Windows mostrar "O Windows protegeu o computador", clique em **Mais informações → Executar assim mesmo**.

## Novidades

${changes}

### Conferir o arquivo (SHA-256)

\`\`\`
${shaFile(sha, setupOf(version)).trim()}
\`\`\`
`
}

// pnpm release-key (uma vez só): cria o par de chaves. A privada vai para a pasta do usuário e a
// pública para o código. Nunca sobrescreve: trocar a chave faz os Laaazy instalados recusarem tudo
function newKey() {
  const file = keyPath()
  if (fs.existsSync(file)) throw new Error(`Já existe uma chave em ${file}. Não troquei (os Laaazy instalados só aceitam essa).`)
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519')
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, privateKey.export({ type: 'pkcs8', format: 'pem' }), { mode: 0o600 })
  fs.writeFileSync(path.join(ROOT, 'electron', 'core', 'release-key.js'), keyModule(publicKey.export({ type: 'spki', format: 'pem' })))
  console.log(`Chave criada.
  Privada: ${file}  (guarde uma cópia fora do PC, ex.: pendrive; sem ela não dá para publicar atualizações)
  Pública: electron/core/release-key.js  (vai no commit)`)
}

// Assina e confere com a chave pública que o Laaazy leva dentro (chave errada para aqui)
function sign(version, sha) {
  const file = keyPath()
  if (!fs.existsSync(file)) throw new Error(`Sem a chave privada em ${file}. Na primeira vez: pnpm release-key.`)
  const signature = signatureFor(fs.readFileSync(file, 'utf8'), version, sha)
  const { RELEASE_PUBLIC_KEY } = require('../electron/core/release-key')
  if (!verifyRelease({ version, sha, signature }, RELEASE_PUBLIC_KEY)) throw new Error('A chave privada não combina com a pública do Laaazy (electron/core/release-key.js).')
  return signature
}

function main() {
  const { version } = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'))
  const changes = changesFor(fs.readFileSync(path.join(ROOT, 'CHANGELOG.md'), 'utf8'), version)
  const dist = path.join(ROOT, 'dist')
  const setup = setupOf(version)
  const sha = crypto.createHash('sha256').update(fs.readFileSync(path.join(dist, setup))).digest('hex')
  const signature = sign(version, sha)
  const out = path.join(dist, `release-v${version}`)
  fs.mkdirSync(out, { recursive: true })
  for (const f of [setup, portableOf(version)]) fs.copyFileSync(path.join(dist, f), path.join(out, f))
  fs.writeFileSync(path.join(out, setup + '.sha256'), shaFile(sha, setup))
  fs.writeFileSync(path.join(out, setup + '.sig'), signature + '\n')
  fs.writeFileSync(path.join(out, 'RELEASE-NOTES.md'), releaseNotes({ version, changes, sha }))
  console.log(`Pronto: ${path.relative(ROOT, out)}

No GitHub: Releases → Draft a new release
  Tag: v${version}   Título: Laaazy ${version}
  Descrição: cole o RELEASE-NOTES.md
  Arquivos: ${setup}, ${setup}.sha256, ${setup}.sig e ${portableOf(version)}
  (o aviso de atualização só aparece com o instalador, o .sha256 e o .sig lá)`)
}

if (require.main === module) {
  try { process.argv.includes('--nova-chave') ? newKey() : main() } catch (e) { console.error(e.message); process.exit(1) }
}

module.exports = { changesFor, shaFile, releaseNotes, signatureFor, keyPath, keyModule }
