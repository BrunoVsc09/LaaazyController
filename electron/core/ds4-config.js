// Qual perfil do DS4Windows usar em cada card e em cada jogo. Sem I/O.
const KEYS = require('../../shared/ds4-keys')

// Menu = Brunera; streamings, navegadores e Área de trabalho = PC, porque abrem no Edge ou
// no Windows e precisam de mouse (dá para trocar na tela de perfis)
const PC = ['desktop', 'Crunchyroll', 'HBO Max', 'Prime Video', 'Netflix', 'YouTube', 'Spotify', 'Google Chrome', 'Firefox']
const DEFAULTS = { menu: 'Brunera', ...Object.fromEntries(PC.map((k) => [k, 'PC'])) }

// Perfil de um jogo específico: "game:" + id do jogo (sem caracteres de controle)
const GAME_KEY = /^game:[^\u0000-\u001f\u007f]{1,300}$/

// Versões antigas salvavam o padrão dos jogos como "Jogos"; hoje é "games" (a nova vence)
function mergeConfig(saved) {
  const { Jogos, ...rest } = saved || {}
  return { ...DEFAULTS, ...(Jogos !== undefined ? { games: Jogos } : {}), ...rest }
}

const profileMissing = (name) => `Perfil "${name}" não encontrado na pasta de perfis.`

// Vazio = "não mudar" (sempre válido); para um jogo, vazio = usar o padrão dos jogos
function validateChange(key, value, profiles) {
  if (!KEYS.includes(key) && !GAME_KEY.test(key)) return { ok: false, msg: `Card desconhecido: ${key}` }
  if (value && !profiles.includes(value)) return { ok: false, msg: profileMissing(value) }
  return { ok: true }
}

// O perfil do jogo; sem um próprio, o padrão dos jogos; sem padrão, nenhum
const gameProfileFor = (cfg, gameId) => cfg[`game:${gameId}`] || cfg.games || ''

module.exports = { KEYS, DEFAULTS, mergeConfig, validateChange, gameProfileFor, profileMissing }
