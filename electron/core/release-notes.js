// Novidades da versão: depois que o Laaazy se atualiza, mostra o que mudou. Os textos vêm da seção
// "## X.Y.Z — data" do CHANGELOG (a mesma que o pnpm release usa). Só o título de cada item. Sem I/O.
const MAX = 80
const HIGHLIGHTS = 'Destaques'

const plain = (s) => s.replace(/\*\*/g, '').replace(/`/g, '')
const short = (s) => (s.length <= MAX ? s : s.slice(0, s.lastIndexOf(' ', MAX)).replace(/[,;:.]$/, '') + '…')

// "**Título (detalhe):** texto" → "Título"; item sem negrito → a primeira frase, sem o ponto
function itemTitle(item) {
  const bold = item.match(/^\*\*(.+?)\*\*/)
  if (bold) return short(bold[1].replace(/:$/, '').replace(/\s*\([^)]*\)\s*$/, '').trim())
  return short(plain(item).replace(/\.$/, '').trim())
}

// Linhas da seção da versão (sem o título "## ..."), até a próxima versão
function sectionLines(changelog, version) {
  const lines = String(changelog).split(/\r?\n/)
  const head = new RegExp(`^## ${version.replace(/\./g, '\\.')} — (\\S+)`)
  const start = lines.findIndex((l) => head.test(l))
  if (start < 0) return null
  const end = lines.findIndex((l, i) => i > start && l.startsWith('## '))
  return { date: lines[start].match(head)[1], lines: lines.slice(start + 1, end < 0 ? undefined : end) }
}

function notesFor(changelog, version) {
  const found = sectionLines(changelog, version)
  if (!found) return null
  const sections = []
  for (const line of found.lines) {
    if (line.startsWith('### ')) sections.push({ title: line.slice(4).trim(), items: [] })
    else if (line.startsWith('- ') && sections.length) sections[sections.length - 1].items.push(itemTitle(line.slice(2)))
  }
  // "### Destaques": resumo escrito para a janela; o resto do CHANGELOG fica para o GitHub
  const filled = sections.filter((s) => s.items.length)
  const highlights = filled.find((s) => s.title === HIGHLIGHTS)
  return { version, date: found.date, sections: highlights ? [highlights] : filled }
}

// Mostra quando a versão mudou desde a última vez. Primeira instalação não (aparecem as boas-vindas);
// quem já usava e nunca viu a janela (lastSeen vazio) vê
const shouldShow = ({ lastSeen, current, newUser }) => !newUser && lastSeen !== current

module.exports = { notesFor, shouldShow }
