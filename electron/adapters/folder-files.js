// Grava arquivos de texto numa pasta (cria a pasta). Fino: o conteúdo vem pronto de quem chama.
const fs = require('fs')
const path = require('path')

async function writeFiles(dir, files) {
  await fs.promises.mkdir(dir, { recursive: true })
  for (const [name, text] of Object.entries(files)) {
    if (path.basename(name) !== name) throw new Error('Nome de arquivo inválido: ' + name) // nunca sai da pasta
    await fs.promises.writeFile(path.join(dir, name), text, 'utf8')
  }
}

module.exports = { writeFiles }
