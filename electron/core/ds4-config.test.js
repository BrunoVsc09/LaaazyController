import { describe, it, expect } from 'vitest'
import mod from './ds4-config.js'

const { mergeConfig, validateChange, DEFAULTS, cardProfile, availableProfile } = mod

describe('ds4-config', () => {
  // Os perfis agora são os do Laaazy-pad: só Jogos e PC (o "Brunera" do DS4Windows virou Jogos)
  it('padrões: Menu, jogos e teclado = Jogos; navegadores e Crunchyroll = PC', () => {
    expect(DEFAULTS).toMatchObject({ menu: 'Jogos', games: 'Jogos', Crunchyroll: 'PC', 'Google Chrome': 'PC', Firefox: 'PC' })
    expect(DEFAULTS.desktop).toBe('PC') // Área de trabalho: controle vira mouse
    // Teclado por cima: controle sem mouse (no PC o X é clique e o cursor atrapalhava o teclado)
    expect(DEFAULTS.keyboard).toBe('Jogos')
    expect(Object.values(DEFAULTS).every((p) => p === 'Jogos' || p === 'PC')).toBe(true)
    // streamings abrem no Edge, que precisa de mouse
    for (const s of ['Netflix', 'Prime Video', 'HBO Max', 'YouTube', 'Spotify']) expect(DEFAULTS[s], s).toBe('PC')
  })
  it('valor salvo vence o padrão, inclusive vazio ("não mudar")', () => {
    expect(mergeConfig({ menu: '', Netflix: 'TV' })).toMatchObject({ menu: '', Netflix: 'TV', Firefox: 'PC' })
  })
  it('chave antiga "Jogos" (versões antigas) vale como o padrão dos jogos ("games")', () => {
    expect(mergeConfig({ Jogos: 'Brunera' })).toMatchObject({ games: 'Brunera' })
    expect(mergeConfig({ Jogos: 'Brunera' })).not.toHaveProperty('Jogos')
    expect(mergeConfig({ Jogos: 'Brunera', games: 'PC' })).toMatchObject({ games: 'PC' }) // a nova vence
  })
  it('aceita card conhecido com perfil existente ou vazio', () => {
    expect(validateChange('Netflix', 'TV', ['TV', 'PC'])).toEqual({ ok: true })
    expect(validateChange('Netflix', '', ['TV'])).toEqual({ ok: true })
  })
  it('recusa card desconhecido', () => {
    expect(validateChange('Minecraft', 'TV', ['TV']).ok).toBe(false)
  })
  it('perfil por jogo (game:<id>) e padrão dos jogos (games)', () => {
    expect(validateChange('games', 'PC', ['PC'])).toEqual({ ok: true })
    expect(validateChange('game:steam:620', 'PC', ['PC'])).toEqual({ ok: true })
    expect(validateChange('game:pc:c:\\jogos\\hades.exe', '', ['PC'])).toEqual({ ok: true })
    expect(validateChange('game:', 'PC', ['PC']).ok).toBe(false)
    expect(validateChange('game:x\u0000y', 'PC', ['PC']).ok).toBe(false)
    expect(validateChange('game:' + 'x'.repeat(400), 'PC', ['PC']).ok).toBe(false)
  })
  it('gameProfileFor: o do jogo, senão o padrão dos jogos, senão nenhum', () => {
    expect(mod.gameProfileFor({ games: 'PC', 'game:steam:1': 'Corrida' }, 'steam:1')).toBe('Corrida')
    expect(mod.gameProfileFor({ games: 'PC', 'game:steam:1': '' }, 'steam:1')).toBe('PC')
    expect(mod.gameProfileFor({ games: 'PC' }, 'epic:x')).toBe('PC')
    expect(mod.gameProfileFor({}, 'epic:x')).toBe('')
  })
  // B6: um perfil que não existe era salvo mesmo devolvendo erro
  it('B6: recusa perfil que não existe na pasta', () => {
    expect(validateChange('Netflix', 'Fantasma', ['TV'])).toEqual({ ok: false, msg: 'Perfil "Fantasma" não encontrado na pasta de perfis.' })
  })
})

// Perfil TV (pedido do Bruno, 2026-10-16): o YouTube com a tela de TV navega com setas, OK e Voltar
describe('ds4-config: YouTube com a tela de TV usa o perfil TV', () => {
  const cfg = mergeConfig({})
  it('tela de TV ligada: o YouTube no PC (o padrão antigo) vai para o TV', () => {
    expect(cardProfile(cfg, 'YouTube', { youtubeTv: true })).toBe('TV')
  })
  it('tela de TV desligada: continua o PC', () => {
    expect(cardProfile(cfg, 'YouTube', { youtubeTv: false })).toBe('PC')
  })
  it('quem escolheu outro perfil para o YouTube continua com ele', () => {
    expect(cardProfile(mergeConfig({ YouTube: 'Brunera' }), 'YouTube', { youtubeTv: true })).toBe('Brunera')
  })
  it('os outros cards não mudam', () => {
    expect(cardProfile(cfg, 'Netflix', { youtubeTv: true })).toBe('PC')
    expect(cardProfile(cfg, 'menu', { youtubeTv: true })).toBe('Jogos')
  })
  it('Laaazy-pad antigo, sem o perfil TV: usa o PC', () => {
    expect(availableProfile('TV', ['Jogos', 'PC'])).toBe('PC')
    expect(availableProfile('TV', ['Jogos', 'PC', 'TV'])).toBe('TV')
    expect(availableProfile('Brunera', ['Jogos'])).toBe('Brunera') // os outros seguem como antes (dá o aviso de perfil que falta)
  })
})