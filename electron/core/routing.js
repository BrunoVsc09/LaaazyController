// Para onde mandar uma URL: dentro do app ou no Edge. Sem I/O.
function hostOf(url) {
  try { return new URL(url).hostname } catch { return null }
}

function serviceForUrl(url, services) {
  const host = hostOf(url)
  if (!host) return null
  return services.find((s) => host === s.domain || host.endsWith('.' + s.domain)) || null
}

const MODES = ['app', 'edge']

// A escolha do usuário (overrides[label]) vence o padrão do catálogo
function openMode(url, services, overrides = {}) {
  const s = serviceForUrl(url, services)
  if (!s) return 'app'
  return MODES.includes(overrides[s.label]) ? overrides[s.label] : s.mode
}

function validModes(modes, services) {
  if (!modes || typeof modes !== 'object' || Array.isArray(modes)) return false
  return Object.entries(modes).every(([label, m]) => services.some((s) => s.label === label) && MODES.includes(m))
}

const isWebUrl = (url) => typeof url === 'string' && /^https?:\/\//i.test(url) && !!hostOf(url)

module.exports = { serviceForUrl, openMode, validModes, isWebUrl }
