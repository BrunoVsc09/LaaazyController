// Qual perfil do DS4Windows usar em cada card. Sem I/O.
const KEYS = require('../../shared/ds4-keys')

// Menu = Brunera; navegadores e Crunchyroll = PC (dá para trocar na tela de perfis)
const DEFAULTS = { menu: 'Brunera', Crunchyroll: 'PC', 'Google Chrome': 'PC', Firefox: 'PC' }

const mergeConfig = (saved) => ({ ...DEFAULTS, ...saved })

const profileMissing = (name) => `Perfil "${name}" não encontrado na pasta de perfis.`

// Vazio = "não mudar" (sempre válido)
function validateChange(key, value, profiles) {
  if (!KEYS.includes(key)) return { ok: false, msg: `Card desconhecido: ${key}` }
  if (value && !profiles.includes(value)) return { ok: false, msg: profileMissing(value) }
  return { ok: true }
}

module.exports = { KEYS, DEFAULTS, mergeConfig, validateChange, profileMissing }
