import { describe, it, expect, vi } from 'vitest'
import foreground from './foreground.js'
import launcherMod from './launcher.js'
import services from '../../shared/streaming.js'

describe('foreground.closeCurrent', () => {
  function make(info) {
    const deps = {
      fgInfo: vi.fn(async () => info),
      ownPids: () => [10],
      selfPid: 10,
      showMenu: vi.fn(),
      kill: vi.fn(),
      later: vi.fn((fn) => fn()),
    }
    return { fg: foreground.createForeground(deps), deps }
  }
  it('descobre a janela da frente ANTES de trazer o menu, e depois fecha com calma e à força', async () => {
    const { fg, deps } = make({ pid: 99, name: 'Hades' })
    expect(await fg.closeCurrent()).toBe(true)
    expect(deps.fgInfo.mock.invocationCallOrder[0]).toBeLessThan(deps.showMenu.mock.invocationCallOrder[0])
    expect(deps.kill.mock.calls).toEqual([[99, false], [99, true]])
    expect(deps.later).toHaveBeenCalledWith(expect.any(Function), 6000)
  })
  it('processo protegido: só traz o menu', async () => {
    const { fg, deps } = make({ pid: 99, name: 'steam' })
    expect(await fg.closeCurrent()).toBe(false)
    expect(deps.showMenu).toHaveBeenCalled()
    expect(deps.kill).not.toHaveBeenCalled()
  })
})

describe('launcher', () => {
  function make({ found = {}, chosen = {} } = {}) {
    const deps = {
      services,
      locator: {
        findOrChoose: vi.fn(async (k) => found[k] || chosen[k] || null),
        programs: { chrome: { label: 'Google Chrome' }, firefox: { label: 'Firefox' }, hydra: { label: 'Hydra' }, ds4windows: { label: 'DS4Windows' }, edge: { label: 'Microsoft Edge' } },
      },
      ds4: { applyFor: vi.fn(), ensureRunning: vi.fn() },
      spawnDetached: vi.fn(async () => ''),
      openPath: vi.fn(async () => ''),
      openExternal: vi.fn(async () => {}),
      openStream: vi.fn(),
      setExternalActive: vi.fn(),
      edgeProfileDir: 'C:\\data\\edge-tv',
      streamModes: () => ({}),
    }
    return { l: launcherMod.createLauncher(deps), deps }
  }

  it('Netflix abre dentro do app com o perfil do DS4 do card', async () => {
    const { l, deps } = make()
    await l.open('https://www.netflix.com', 'Netflix')
    expect(deps.ds4.applyFor).toHaveBeenCalledWith('Netflix')
    expect(deps.openStream).toHaveBeenCalledWith('https://www.netflix.com')
  })
  it('Crunchyroll abre no Edge em tela cheia com perfil próprio', async () => {
    const { l, deps } = make({ found: { edge: 'C:\\E\\msedge.exe' } })
    await l.open('https://www.crunchyroll.com', 'Crunchyroll')
    expect(deps.openStream).not.toHaveBeenCalled()
    expect(deps.setExternalActive).toHaveBeenCalledWith(true)
    expect(deps.ds4.ensureRunning).toHaveBeenCalled()
    expect(deps.spawnDetached).toHaveBeenCalledWith('C:\\E\\msedge.exe', ['--kiosk', 'https://www.crunchyroll.com', '--edge-kiosk-type=fullscreen', '--user-data-dir=C:\\data\\edge-tv', '--no-first-run'])
  })
  it('sem Edge, abre no navegador padrão', async () => {
    const { l, deps } = make()
    await l.open('https://www.crunchyroll.com', 'Crunchyroll')
    expect(deps.openExternal).toHaveBeenCalledWith('https://www.crunchyroll.com')
  })
  it('Chrome: aplica o perfil, marca como externo e abre', async () => {
    const { l, deps } = make({ found: { chrome: 'C:\\G\\chrome.exe' } })
    expect(await l.launch('chrome')).toBe('')
    expect(deps.ds4.applyFor).toHaveBeenCalledWith('Google Chrome')
    expect(deps.setExternalActive).toHaveBeenCalledWith(true)
    expect(deps.spawnDetached).toHaveBeenCalledWith('C:\\G\\chrome.exe', [])
  })
  it('navegador não encontrado', async () => {
    expect(await make().l.launch('firefox')).toBe('Não achei o Firefox.')
  })
  it('Hydra e DS4Windows abrem pelo Windows', async () => {
    const { l, deps } = make({ found: { hydra: 'C:\\H\\Hydra.exe' } })
    expect(await l.launch('hydra')).toBe('')
    expect(deps.openPath).toHaveBeenCalledWith('C:\\H\\Hydra.exe')
    expect(await l.launch('ds4windows')).toBe('Não achei o DS4Windows.')
  })
  it('programa desconhecido', async () => {
    expect(await make().l.launch('notepad')).toBe('Programa desconhecido.')
  })
})
