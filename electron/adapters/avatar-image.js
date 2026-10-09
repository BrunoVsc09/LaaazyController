// Foto do perfil escolhida no PC: recorta o meio em quadrado, reduz para 256 px e guarda uma cópia
// PNG (avatar.png). Usa o nativeImage do próprio Electron (lê PNG e JPG; sem dependência nova).
const fs = require('fs')
const { nativeImage } = require('electron')

const SIZE = 256
const MAX_BYTES = 5 * 1024 * 1024

function createAvatarImage({ file }) {
  async function save(src) {
    try {
      if ((await fs.promises.stat(src)).size > MAX_BYTES) return 'A foto é grande demais (até 5 MB).'
      const img = nativeImage.createFromPath(src)
      if (img.isEmpty()) return 'Não consegui ler essa imagem. Use PNG ou JPG.'
      const { width, height } = img.getSize()
      const side = Math.min(width, height)
      const square = img.crop({ x: Math.floor((width - side) / 2), y: Math.floor((height - side) / 2), width: side, height: side })
      await fs.promises.writeFile(file, square.resize({ width: SIZE, height: SIZE, quality: 'best' }).toPNG())
      return ''
    } catch (e) {
      return 'Não consegui guardar a foto: ' + e.message
    }
  }

  async function dataUrl() {
    if (!fs.existsSync(file)) return ''
    const img = nativeImage.createFromPath(file)
    return img.isEmpty() ? '' : img.toDataURL()
  }

  return { save, dataUrl }
}

module.exports = { createAvatarImage }
