// Monta um .ico do Windows a partir de PNGs (o formato aceita PNG dentro desde o Vista).
// Usado por scripts/make-icons.js para o ícone do .exe, da janela e da barra de tarefas.
const HEADER = 6
const ENTRY = 16

// images: [{ size: 16..256, data: Buffer (PNG) }] → Buffer do .ico
function pngsToIco(images) {
  for (const { size } of images) {
    if (!Number.isInteger(size) || size < 1 || size > 256) throw new Error(`Tamanho inválido para .ico: ${size}`)
  }
  const head = Buffer.alloc(HEADER + ENTRY * images.length)
  head.writeUInt16LE(0, 0) // reservado
  head.writeUInt16LE(1, 2) // 1 = ícone
  head.writeUInt16LE(images.length, 4)
  let offset = head.length
  images.forEach(({ size, data }, i) => {
    const e = HEADER + ENTRY * i
    head[e] = size === 256 ? 0 : size // largura (0 = 256)
    head[e + 1] = size === 256 ? 0 : size // altura
    head[e + 2] = 0 // paleta
    head[e + 3] = 0 // reservado
    head.writeUInt16LE(1, e + 4) // planos
    head.writeUInt16LE(32, e + 6) // bits por pixel
    head.writeUInt32LE(data.length, e + 8)
    head.writeUInt32LE(offset, e + 12)
    offset += data.length
  })
  return Buffer.concat([head, ...images.map((im) => im.data)])
}

module.exports = { pngsToIco }
