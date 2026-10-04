import { describe, it, expect } from 'vitest'
import routing from './routing.js'
import processes from './processes.js'
import appPath from './app-path.js'
import services from '../../shared/streaming.js'

describe('routing', () => {
  it('acha o serviço pelo domínio, inclusive subdomínios', () => {
    expect(routing.serviceForUrl('https://www.netflix.com/browse', services).label).toBe('Netflix')
    expect(routing.serviceForUrl('https://crunchyroll.com', services).label).toBe('Crunchyroll')
  })
  it('domínio parecido não engana (notnetflix.com)', () => {
    expect(routing.serviceForUrl('https://notnetflix.com', services)).toBeNull()
  })
  it('URL inválida não quebra', () => {
    expect(routing.serviceForUrl('não é url', services)).toBeNull()
  })
  // Sem assinatura VMP de produção (conta corporativa na castlabs), DRM dentro do app falha (Netflix: E100)
  it('modo padrão: todos os serviços de streaming no Edge; site desconhecido no app', () => {
    for (const s of services) expect(routing.openMode(s.url, services), s.label).toBe('edge')
    expect(routing.openMode('https://exemplo.com', services)).toBe('app')
  })
  it('isWebUrl aceita só http(s)', () => {
    expect(routing.isWebUrl('https://x.com')).toBe(true)
    expect(routing.isWebUrl('file:///C:/Windows')).toBe(false)
    expect(routing.isWebUrl(42)).toBe(false)
  })
})

describe('processes.shouldClose', () => {
  const ctx = { selfPid: 10, ownPids: [10, 11] }
  it('fecha o programa comum da frente', () => {
    expect(processes.shouldClose({ pid: 99, name: 'Hades' }, ctx)).toBe(true)
  })
  it('nunca fecha o próprio app, processos dele ou sem pid', () => {
    expect(processes.shouldClose({ pid: 0, name: '' }, ctx)).toBe(false)
    expect(processes.shouldClose({ pid: 10, name: 'x' }, ctx)).toBe(false)
    expect(processes.shouldClose({ pid: 11, name: 'x' }, ctx)).toBe(false)
  })
  it('nunca fecha Windows, Steam e DS4Windows (sem diferenciar maiúsculas)', () => {
    for (const name of ['explorer', 'Steam', 'steamwebhelper', 'DS4Windows', 'dwm', 'Lazy PS4']) {
      expect(processes.shouldClose({ pid: 99, name }, ctx)).toBe(false)
    }
  })
})

describe('appFileFor (protocolo app://)', () => {
  const root = 'C:\\app\\out'
  it('/ vira index.html', () => {
    expect(appPath.appFileFor('/', root)).toBe('C:\\app\\out\\index.html')
  })
  it('arquivo dentro de out/', () => {
    expect(appPath.appFileFor('/_next/static/a%20b.js', root)).toBe('C:\\app\\out\\_next\\static\\a b.js')
  })
  it('bloqueia sair da pasta (path traversal), inclusive pasta irmã com mesmo prefixo', () => {
    expect(appPath.appFileFor('/../../Windows/win.ini', root)).toBeNull()
    expect(appPath.appFileFor('/../out-outra/x', root)).toBeNull()
  })
  // B4: decodeURIComponent lançava exceção com URL malformada
  it('B4: URL malformada devolve null em vez de lançar exceção', () => {
    expect(() => appPath.appFileFor('/%E0%A4%A', root)).not.toThrow()
    expect(appPath.appFileFor('/%E0%A4%A', root)).toBeNull()
  })
})
