import { describe, it, expect } from 'vitest'
import routing from './routing.js'
import drm from './drm.js'
import services from '../../shared/streaming.js'

describe('openMode com a escolha do usuário', () => {
  it('a escolha do usuário vence o padrão do catálogo', () => {
    expect(routing.openMode('https://www.netflix.com', services, { Netflix: 'edge' })).toBe('edge')
    expect(routing.openMode('https://www.crunchyroll.com', services, { Crunchyroll: 'app' })).toBe('app')
  })
  it('escolha inválida é ignorada', () => {
    expect(routing.openMode('https://www.netflix.com', services, { Netflix: 'chrome' })).toBe('edge')
  })
  it('validModes só aceita serviços do catálogo e app/edge', () => {
    expect(routing.validModes({ Netflix: 'edge', 'Prime Video': 'app' }, services)).toBe(true)
    expect(routing.validModes({ Netflix: 'chrome' }, services)).toBe(false)
    expect(routing.validModes({ Minecraft: 'app' }, services)).toBe(false)
    expect(routing.validModes([], services)).toBe(false)
  })
})

describe('catálogo de streaming', () => {
  it('serviços com DRM marcados (YouTube não precisa)', () => {
    const drmOn = services.filter((s) => s.drm).map((s) => s.label)
    expect(drmOn).toEqual(['Crunchyroll', 'HBO Max', 'Prime Video', 'Netflix', 'Spotify'])
  })
})

describe('drm.widevineStatus', () => {
  it('Widevine instalado com versão', () => {
    const status = { abc: { title: 'Widevine Content Decryption Module', status: 'up-to-date', version: '4.10.2830.0' } }
    expect(drm.widevineStatus(status)).toEqual({ installed: true, version: '4.10.2830.0', msg: 'Widevine instalado (versão 4.10.2830.0).' })
  })
  it('Widevine sem versão = não instalado', () => {
    const status = { abc: { title: 'Widevine Content Decryption Module', status: 'new', version: null } }
    expect(drm.widevineStatus(status)).toMatchObject({ installed: false })
  })
  it('sem componente Widevine', () => {
    expect(drm.widevineStatus({})).toEqual({ installed: false, version: '', msg: 'Widevine não instalado. Vídeos com proteção (Netflix, Prime...) não vão tocar dentro do app.' })
    expect(drm.widevineStatus(null)).toMatchObject({ installed: false })
  })
})
