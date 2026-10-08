import { describe, it, expect } from 'vitest'
import sec from './security.js'
import C from '../../shared/channels.js'

describe('trustedSender: quem pode falar com o Laaazy pelos canais', () => {
  it('a tela do app e o teclado por cima (app://local) usam todos os canais', () => {
    expect(sec.trustedSender('app://local/', C.GAMES_LAUNCH)).toBe(true)
    expect(sec.trustedSender('app://local/keyboard.html', C.OSK_EDIT)).toBe(true)
  })
  it('sites de streaming só usam os comandos do controle (voltar, teclas do player, volume, Início)', () => {
    for (const ch of [C.BACK, C.KEY, C.VOLUME, C.HOME]) expect(sec.trustedSender('https://www.netflix.com/browse', ch)).toBe(true)
    expect(sec.trustedSender('https://www.netflix.com/browse', C.GAMES_LAUNCH)).toBe(false)
    expect(sec.trustedSender('https://www.netflix.com/browse', C.AI_SET_KEY)).toBe(false)
  })
  it('qualquer outra origem é recusada', () => {
    expect(sec.trustedSender('http://localhost:3000/', C.SETTINGS_GET)).toBe(false)
    expect(sec.trustedSender('file:///C:/x.html', C.SETTINGS_GET)).toBe(false)
    expect(sec.trustedSender('app://outro/', C.SETTINGS_GET)).toBe(false)
    expect(sec.trustedSender('', C.HOME)).toBe(false)
    expect(sec.trustedSender(undefined, C.HOME)).toBe(false)
  })
})

describe('CSP da tela do app', () => {
  const rules = Object.fromEntries(sec.CSP.split(';').map((r) => r.trim().split(/\s+/)).map(([k, ...v]) => [k, v]))
  it('só roda script do próprio app; nada de plugins', () => {
    expect(rules['script-src']).toEqual(["'self'", "'unsafe-inline'"]) // o Next exporta scripts inline
    expect(rules['object-src']).toEqual(["'none'"])
    expect(rules['base-uri']).toEqual(["'self'"])
  })
  it('a tela não conversa com a internet por conta própria (quem fala com APIs é o Electron)', () => {
    expect(rules['connect-src']).toEqual(["'self'"])
  })
  it('só o player do YouTube pode ser embutido', () => {
    expect(rules['frame-src']).toEqual(['https://www.youtube-nocookie.com'])
  })
  it('imagens das capas (TMDB, Steam, SteamGridDB) e sons dos comandos liberados', () => {
    expect(rules['img-src']).toEqual(expect.arrayContaining(["'self'", 'https:', 'data:']))
    expect(rules['media-src']).toEqual(["'self'", 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com'])
  })
})

describe('allowNavigation: a janela do app não sai do app', () => {
  it('só app://local', () => {
    expect(sec.allowNavigation('app://local/keyboard.html')).toBe(true)
    expect(sec.allowNavigation('https://evil.com/')).toBe(false)
    expect(sec.allowNavigation('file:///C:/Windows/')).toBe(false)
  })
})

describe('allowPermission: o que sites e a tela podem pedir', () => {
  it('tela cheia e DRM (Widevine) liberados; o resto negado', () => {
    expect(sec.allowPermission('fullscreen')).toBe(true)
    expect(sec.allowPermission('protected-media-identifier')).toBe(true)
    for (const p of ['media', 'geolocation', 'notifications', 'midi', 'openExternal', 'clipboard-read', 'hid', 'serial', 'usb']) {
      expect(sec.allowPermission(p), p).toBe(false)
    }
  })
})

describe('cspHeaderFor: o CSP vai junto com as páginas do app', () => {
  it('páginas .html levam o cabeçalho; arquivos de script, imagem etc. não precisam', () => {
    expect(sec.cspHeaderFor('C:/out/index.html')).toEqual({ 'Content-Security-Policy': sec.CSP })
    expect(sec.cspHeaderFor('C:/out/keyboard.HTML')).toEqual({ 'Content-Security-Policy': sec.CSP })
    expect(sec.cspHeaderFor('C:/out/_next/a.js')).toEqual({})
  })
})
