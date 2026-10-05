// Regras de blindagem do Electron. Sem I/O: main.js e ipc/register.js aplicam.
const C = require('../../shared/channels')

const APP = 'app://local/'
// O que um site de streaming (stream-preload) pode pedir: só os comandos do controle
const STREAM_CHANNELS = new Set([C.BACK, C.KEY, C.VOLUME, C.HOME])

const isApp = (url) => typeof url === 'string' && url.startsWith(APP)

// Canal IPC vindo de `url` pode ser atendido?
function trustedSender(url, channel) {
  if (isApp(url)) return true
  return typeof url === 'string' && url.startsWith('https://') && STREAM_CHANNELS.has(channel)
}

// Política de conteúdo da tela do app (servida pelo protocolo app://)
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'", // o Next exporta scripts inline
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' https: data: blob:", // capas do TMDB, Steam e SteamGridDB
  "media-src 'self' https://hebbkx1anhila5yf.public.blob.vercel-storage.com", // sons dos comandos
  "font-src 'self' data:",
  "connect-src 'self'", // quem fala com as APIs é o Electron, não a tela
  'frame-src https://www.youtube-nocookie.com', // prévia do trailer
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join('; ')

// A janela do app nunca navega para fora dele
const allowNavigation = (url) => isApp(url)

// Permissões que a tela ou um site podem receber
const ALLOWED_PERMISSIONS = new Set(['fullscreen', 'protected-media-identifier'])
const allowPermission = (permission) => ALLOWED_PERMISSIONS.has(permission)

// Cabeçalhos extras de um arquivo servido pelo app://
const cspHeaderFor = (file) => (/\.html$/i.test(String(file)) ? { 'Content-Security-Policy': CSP } : {})

module.exports = { trustedSender, CSP, cspHeaderFor, allowNavigation, allowPermission, APP }
