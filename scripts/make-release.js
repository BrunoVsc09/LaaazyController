// pnpm release: depois do pnpm dist, prepara em dist/release-vX.Y.Z o que sobe na release do GitHub:
// o instalador, o .sha256 (o Laaazy confere o download com ele) e as notas (do CHANGELOG).
// Não publica nada: quem cria a release no GitHub é o Bruno (sem token no projeto).
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const ROOT = path.join(__dirname, '..')

// Trecho "## X.Y.Z — data" do CHANGELOG, sem o título, até a próxima versão
function changesFor(changelog, version) {
  const lines = changelog.replace(/\r\n/g, '\n').split('\n')
  const start = lines.findIndex((l) => new RegExp(`^## ${version.replace(/\./g, '\\.')} — \\d{4}-\\d{2}-\\d{2}$`).test(l))
  if (start < 0) throw new Error(`O CHANGELOG não tem a seção "## ${version} — data".`)
  const end = lines.findIndex((l, i) => i > start && l.startsWith('## '))
  return lines.slice(start + 1, end < 0 ? undefined : end).join('\n').trim()
}

const setupOf = (version) => `Laaazy-Setup-${version}-x64.exe`
const portableOf = (version) => `Laaazy-${version}-x64-portatil.exe`
const shaFile = (sha, name) => `${sha}  ${name}\n`

function releaseNotes({ version, changes, sha }) {
  return `## Download

| Arquivo | Para quem |
|---|---|
| **${setupOf(version)}** | Instalador (recomendado). Windows 10 e 11, 64 bits. Não pede administrador. Quem já tem o Laaazy instalado recebe esta versão pelo aviso de atualização. |
| **${portableOf(version)}** | Versão portátil, sem instalar (não se atualiza sozinha). |

> Os perfis do controle são do **Laaazy-pad**, instalado à parte. Sem ele, o Laaazy funciona, mas sem o PS e sem a troca de perfis.

> O instalador não tem assinatura digital paga. Se o Windows mostrar "O Windows protegeu o computador", clique em **Mais informações → Executar assim mesmo**.

## Novidades

${changes}

### Conferir o arquivo (SHA-256)

\`\`\`
${shaFile(sha, setupOf(version)).trim()}
\`\`\`
`
}

function main() {
  const { version } = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'))
  const changes = changesFor(fs.readFileSync(path.join(ROOT, 'CHANGELOG.md'), 'utf8'), version)
  const dist = path.join(ROOT, 'dist')
  const out = path.join(dist, `release-v${version}`)
  fs.mkdirSync(out, { recursive: true })
  const setup = setupOf(version)
  const sha = crypto.createHash('sha256').update(fs.readFileSync(path.join(dist, setup))).digest('hex')
  for (const f of [setup, portableOf(version)]) fs.copyFileSync(path.join(dist, f), path.join(out, f))
  fs.writeFileSync(path.join(out, setup + '.sha256'), shaFile(sha, setup))
  fs.writeFileSync(path.join(out, 'RELEASE-NOTES.md'), releaseNotes({ version, changes, sha }))
  console.log(`Pronto: ${path.relative(ROOT, out)}

No GitHub: Releases → Draft a new release
  Tag: v${version}   Título: Laaazy ${version}
  Descrição: cole o RELEASE-NOTES.md
  Arquivos: ${setup}, ${setup}.sha256 e ${portableOf(version)}
  (o aviso de atualização só aparece se o instalador e o .sha256 estiverem lá)`)
}

if (require.main === module) main()

module.exports = { changesFor, shaFile, releaseNotes }
