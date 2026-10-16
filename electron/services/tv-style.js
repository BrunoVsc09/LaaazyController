// Streaming: legenda grande nos serviços abertos no Edge. Grava a extensão do Laaazy (só CSS) no
// tamanho escolhido nas Configurações; o launcher abre o Edge com ela (--load-extension).
// O Edge só lê a extensão ao abrir: trocar o tamanho vale da próxima vez que ele abrir.
const { extensionFiles } = require('../core/tv-style')

// writeFiles(dir, { nome: texto }) grava os arquivos (cria a pasta)
// youtubeTv(): o YouTube abre com a tela de TV (a extensão leva a parte do YouTube)
function createTvStyle({ size, youtubeTv = () => false, dir, writeFiles }) {
  // A pasta da extensão para o Edge, ou null ("Do site", ou não deu para gravar: abre sem ela)
  async function prepare() {
    const files = extensionFiles(size(), { youtubeTv: youtubeTv() === true })
    if (!files) return null
    try {
      await writeFiles(dir, files)
      return dir
    } catch {
      return null
    }
  }
  return { prepare }
}

module.exports = { createTvStyle }
