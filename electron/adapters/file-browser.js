// Lê pastas do disco para o navegador de pastas do Laaazy.
const fs = require('fs')
const rules = require('../core/fs-browse')

// known: pastas de verdade do Windows (Imagens, Área de trabalho, Downloads), vindas do Electron
function createFileBrowser({ env = process.env, exists = fs.existsSync, known = () => ({}) } = {}) {
  // '' = início: atalhos e discos
  async function list(dir, mode) {
    if (!dir) {
      const entries = [
        ...rules.places(env, exists, mode, known()).map((p) => ({ name: p.label, path: p.path, type: 'place' })),
        ...rules.drives(exists).map((d) => ({ name: `Disco ${d.slice(0, 2)}`, path: d, type: 'drive' })),
      ]
      return { ok: true, path: '', parent: null, entries }
    }
    if (!rules.isBrowsable(dir)) return { ok: false, msg: 'Pasta inválida.', entries: [] }
    try {
      const dirents = await fs.promises.readdir(dir, { withFileTypes: true })
      return { ok: true, path: dir, parent: rules.parentOf(dir) ?? '', entries: rules.shapeEntries(dirents, dir, mode) }
    } catch (e) {
      return { ok: false, msg: `Não consegui abrir essa pasta (${e.code || e.message}).`, entries: [] }
    }
  }

  return { list }
}

module.exports = { createFileBrowser }
