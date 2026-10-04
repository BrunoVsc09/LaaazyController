// Segredos (ex.: chave do TMDB) criptografados com a proteção de dados do Windows
// (safeStorage do Electron). Sem criptografia disponível, nada é salvo: nunca texto puro.
function createSecretStore({ safeStorage, read, write }) {
  function get(name) {
    const enc = read()[name]
    if (!enc) return ''
    try { return safeStorage.decryptString(Buffer.from(enc, 'base64')) } catch { return '' }
  }

  function set(name, value) {
    if (!safeStorage.isEncryptionAvailable()) return false
    return write({ ...read(), [name]: safeStorage.encryptString(value).toString('base64') })
  }

  function clear(name) {
    const { [name]: _gone, ...rest } = read()
    return write(rest)
  }

  return { get, set, clear }
}

module.exports = { createSecretStore }
