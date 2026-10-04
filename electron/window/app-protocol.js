// Protocolo app:// que serve a pasta out/ (a tela gerada pelo Next).
const { protocol, net } = require('electron')
const { pathToFileURL } = require('url')
const { appFileFor } = require('../core/app-path')

// Precisa ser chamado antes do app ficar pronto
function registerAppScheme() {
  protocol.registerSchemesAsPrivileged([
    { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } },
  ])
}

function handleAppProtocol(root) {
  protocol.handle('app', (req) => {
    const file = appFileFor(new URL(req.url).pathname, root)
    if (!file) return new Response('not found', { status: 404 })
    return net.fetch(pathToFileURL(file).toString())
  })
}

module.exports = { registerAppScheme, handleAppProtocol }
