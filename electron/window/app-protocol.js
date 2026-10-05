// Protocolo app:// que serve a pasta out/ (a tela gerada pelo Next).
const { protocol, net } = require('electron')
const { pathToFileURL } = require('url')
const { appFileFor } = require('../core/app-path')
const { cspHeaderFor } = require('../core/security')

// Precisa ser chamado antes do app ficar pronto
function registerAppScheme() {
  protocol.registerSchemesAsPrivileged([
    { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } },
  ])
}

function handleAppProtocol(root) {
  protocol.handle('app', async (req) => {
    const file = appFileFor(new URL(req.url).pathname, root)
    if (!file) return new Response('not found', { status: 404 })
    const res = await net.fetch(pathToFileURL(file).toString())
    const extra = cspHeaderFor(file)
    if (!Object.keys(extra).length) return res
    const headers = new Headers(res.headers)
    for (const [k, v] of Object.entries(extra)) headers.set(k, v)
    return new Response(res.body, { status: res.status, headers })
  })
}

module.exports = { registerAppScheme, handleAppProtocol }
