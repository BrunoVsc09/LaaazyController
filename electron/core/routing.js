// Para onde mandar uma URL: dentro do app ou no Edge. Sem I/O.
function hostOf(url) {
  try { return new URL(url).hostname } catch { return null }
}

function serviceForUrl(url, services) {
  const host = hostOf(url)
  if (!host) return null
  return services.find((s) => host === s.domain || host.endsWith('.' + s.domain)) || null
}

function openMode(url, services) {
  const s = serviceForUrl(url, services)
  return s ? s.mode : 'app'
}

const isWebUrl = (url) => typeof url === 'string' && /^https?:\/\//i.test(url) && !!hostOf(url)

module.exports = { serviceForUrl, openMode, isWebUrl }
