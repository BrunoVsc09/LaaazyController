// Gera todos os ícones do Laaazy a partir de docs/assets/logo.svg (o controle dormindo).
// Uso: pnpm icons   (roda dentro do Electron para desenhar o SVG num canvas com transparência)
const { app, BrowserWindow } = require('electron')
const fs = require('fs')
const path = require('path')
const { pngsToIco } = require('./ico')

const ROOT = path.join(__dirname, '..')
const LOGO = path.join(ROOT, 'docs', 'assets', 'logo.svg')
const ICO_SIZES = [16, 24, 32, 48, 64, 128, 256]

app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false })
  await win.loadURL('data:text/html,<body></body>')
  const svg = fs.readFileSync(LOGO, 'utf8')
  // Foto de perfil padrão (avatar-01): aparece recortada em círculo, então o fundo ocupa o quadrado
  // todo e o desenho encolhe para o meio (senão o "z" do canto é cortado)
  const avatarSvg = svg
    .replace(/<rect width="512" height="512" rx="112" (fill="url\(#lzBg\)")\/>/, '<rect width="512" height="512" $1/><g transform="translate(256 256) scale(.74) translate(-256 -256)">')
    .replace('</svg>', '</g></svg>')
  // SVG → PNG no tamanho pedido (canvas mantém os cantos transparentes)
  const render = async (size, src = svg) => {
    const dataUrl = await win.webContents.executeJavaScript(`new Promise((ok, fail) => {
      const img = new Image()
      img.onload = () => { const c = document.createElement('canvas'); c.width = c.height = ${size}; c.getContext('2d').drawImage(img, 0, 0, ${size}, ${size}); ok(c.toDataURL('image/png')) }
      img.onerror = fail
      img.src = 'data:image/svg+xml;base64,' + ${JSON.stringify(Buffer.from(src).toString('base64'))}
    })`)
    return Buffer.from(dataUrl.split(',')[1], 'base64')
  }
  const write = (rel, data) => { const f = path.join(ROOT, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, data); console.log('✓', rel) }

  const ico = pngsToIco(await Promise.all(ICO_SIZES.map(async (size) => ({ size, data: await render(size) }))))
  write('build/icon.ico', ico) // .exe (electron-builder)
  write('electron/assets/icon.ico', ico) // janela e barra de tarefas
  write('public/icon-light-32x32.png', await render(32))
  write('public/icon-dark-32x32.png', await render(32))
  write('public/apple-icon.png', await render(180))
  write('public/icon.svg', svg)
  write('docs/assets/logo-512.png', await render(512))
  write('public/avatars/avatar-01.png', await render(512, avatarSvg))
  app.quit()
})
