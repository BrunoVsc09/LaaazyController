import { describe, it, expect } from 'vitest'
import mod from './ds4-config.js'

const { mergeConfig, validateChange, DEFAULTS } = mod

describe('ds4-config', () => {
  it('padrões: Menu = Brunera; navegadores e Crunchyroll = PC', () => {
    expect(DEFAULTS).toEqual({ menu: 'Brunera', Crunchyroll: 'PC', 'Google Chrome': 'PC', Firefox: 'PC' })
  })
  it('valor salvo vence o padrão, inclusive vazio ("não mudar")', () => {
    expect(mergeConfig({ menu: '', Netflix: 'TV' })).toMatchObject({ menu: '', Netflix: 'TV', Firefox: 'PC' })
  })
  it('aceita card conhecido com perfil existente ou vazio', () => {
    expect(validateChange('Netflix', 'TV', ['TV', 'PC'])).toEqual({ ok: true })
    expect(validateChange('Netflix', '', ['TV'])).toEqual({ ok: true })
  })
  it('recusa card desconhecido', () => {
    expect(validateChange('Minecraft', 'TV', ['TV']).ok).toBe(false)
  })
  // B6: um perfil que não existe era salvo mesmo devolvendo erro
  it('B6: recusa perfil que não existe na pasta', () => {
    expect(validateChange('Netflix', 'Fantasma', ['TV'])).toEqual({ ok: false, msg: 'Perfil "Fantasma" não encontrado na pasta de perfis.' })
  })
})
