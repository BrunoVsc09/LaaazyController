import { describe, it, expect, vi } from 'vitest'
import foreground from './foreground.js'
import launcherMod from './launcher.js'
import services from '../../shared/streaming.js'

describe('foreground.closeCurrent', () => {
  function make(info) {
    const deps = {
      fgInfo: vi.fn(async () => info),
      ownPids: () => [10],
      ancestorPids: () => [7, 3],
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
  it('closeAndHome (botão PS): descobre a janela antes, volta ao Início e mata na hora, sem esperar', async () => {
    const { fg, deps } = make({ pid: 99, name: 'Hades' })
    expect(await fg.closeAndHome()).toBe(true)
    expect(deps.fgInfo.mock.invocationCallOrder[0]).toBeLessThan(deps.showMenu.mock.invocationCallOrder[0])
    expect(deps.kill.mock.calls).toEqual([[99, true]])
    expect(deps.later).not.toHaveBeenCalled()
  })
  it('closeAndHome com processo protegido (Steam, Explorer): só volta ao Início', async () => {
    const { fg, deps } = make({ pid: 99, name: 'explorer' })
    expect(await fg.closeAndHome()).toBe(false)
    expect(deps.showMenu).toHaveBeenCalled()
    expect(deps.kill).not.toHaveBeenCalled()
  })
  it('PS com o terminal que abriu o Laaazy na frente: só volta ao Início (fechar levaria o Laaazy junto)', async () => {
    const { fg, deps } = make({ pid: 7, name: 'WindowsTerminal' })
    expect(await fg.closeAndHome()).toBe(false)
    expect(deps.showMenu).toHaveBeenCalled()
    expect(deps.kill).not.toHaveBeenCalled()
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

  it('com a escolha "App", Prime Video abre dentro do app com o perfil do DS4 do card', async () => {
    const { deps } = make()
    deps.streamModes = () => ({ 'Prime Video': 'app' })
    const l = launcherMod.createLauncher(deps)
    await l.open('https://www.primevideo.com', 'Prime Video')
    expect(deps.ds4.applyFor).toHaveBeenCalledWith('Prime Video')
    expect(deps.openStream).toHaveBeenCalledWith('https://www.primevideo.com')
  })
  it('Netflix abre no Edge por padrão', async () => {
    const { l, deps } = make({ found: { edge: 'C:\\E\\msedge.exe' } })
    await l.open('https://www.netflix.com', 'Netflix')
    expect(deps.openStream).not.toHaveBeenCalled()
    expect(deps.spawnDetached).toHaveBeenCalledWith('C:\\E\\msedge.exe', expect.arrayContaining(['--app=https://www.netflix.com']))
  })
  // Regressão (2026-10-09, achado pelo Bruno): apertar X mais uma vez enquanto o Edge ainda abria
  // abria uma segunda janela do mesmo serviço (e o PS só fechava uma delas)
  it('o mesmo serviço pedido de novo enquanto ainda abre: não abre outra janela', async () => {
    const { deps } = make({ found: { edge: 'C:\\E\\msedge.exe' } })
    let t = 1000
    deps.now = () => t
    const l = launcherMod.createLauncher(deps)
    expect(await l.open('https://www.netflix.com', 'Netflix')).toBe('')
    t += 3000
    expect(await l.open('https://www.netflix.com', 'Netflix')).toBe('')
    expect(deps.spawnDetached).toHaveBeenCalledTimes(1)
    await l.open('https://www.crunchyroll.com', 'Crunchyroll') // outro serviço abre normalmente
    expect(deps.spawnDetached).toHaveBeenCalledTimes(2)
    t += 10000 // passou o tempo de abrir: pedir de novo abre de novo
    await l.open('https://www.netflix.com', 'Netflix')
    expect(deps.spawnDetached).toHaveBeenCalledTimes(3)
  })
  it('se não abriu (erro), tentar de novo logo em seguida funciona', async () => {
    const { deps } = make({ found: { edge: 'C:\\E\\msedge.exe' } })
    deps.spawnDetached = vi.fn(async () => 'O Edge não abriu.')
    const l = launcherMod.createLauncher(deps)
    expect(await l.open('https://www.netflix.com', 'Netflix')).toBe('O Edge não abriu.')
    expect(await l.open('https://www.netflix.com', 'Netflix')).toBe('O Edge não abriu.')
    expect(deps.spawnDetached).toHaveBeenCalledTimes(2)
  })
  it('Crunchyroll abre no Edge em tela cheia com perfil próprio', async () => {
    const { l, deps } = make({ found: { edge: 'C:\\E\\msedge.exe' } })
    await l.open('https://www.crunchyroll.com', 'Crunchyroll')
    expect(deps.openStream).not.toHaveBeenCalled()
    expect(deps.setExternalActive).toHaveBeenCalledWith(true)
    expect(deps.ds4.ensureRunning).toHaveBeenCalled()
    // Sem --kiosk: o modo quiosque do Edge é sempre InPrivate e não guarda os logins
    const args = deps.spawnDetached.mock.calls[0][1]
    expect(deps.spawnDetached.mock.calls[0][0]).toBe('C:\\E\\msedge.exe')
    expect(args).toEqual(['--user-data-dir=C:\\data\\edge-tv', '--no-first-run', '--start-fullscreen', '--app=https://www.crunchyroll.com'])
    expect(args.join(' ')).not.toMatch(/kiosk|inprivate/i)
  })
  it('streaming com a aceleração de vídeo desligada (tela preta): Edge sem GPU, num perfil separado', async () => {
    const { deps } = make({ found: { edge: 'C:\\E\\msedge.exe' } })
    deps.edgeNoGpu = () => ['Crunchyroll']
    const l = launcherMod.createLauncher(deps)
    await l.open('https://www.crunchyroll.com', 'Crunchyroll')
    // o Edge só lê --disable-gpu ao abrir: perfil separado para não pegar um Edge já aberto com GPU
    expect(deps.spawnDetached.mock.calls[0][1]).toEqual([
      '--user-data-dir=C:\\data\\edge-tv-sem-aceleracao', '--disable-gpu', '--no-first-run', '--start-fullscreen', '--app=https://www.crunchyroll.com',
    ])
    await l.open('https://www.netflix.com', 'Netflix') // os outros continuam com aceleração
    expect(deps.spawnDetached.mock.calls[1][1][0]).toBe('--user-data-dir=C:\\data\\edge-tv')
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
  it('YouTube também abre no Edge por padrão', async () => {
    const { l, deps } = make({ found: { edge: 'C:\\E\\msedge.exe' } })
    await l.open('https://www.youtube.com/tv', 'YouTube')
    expect(deps.openStream).not.toHaveBeenCalled()
    expect(deps.spawnDetached).toHaveBeenCalled()
  })
  it('a escolha "App" do usuário traz a Netflix de volta para dentro do app', async () => {
    const { deps } = make()
    deps.streamModes = () => ({ Netflix: 'app' })
    const l2 = launcherMod.createLauncher(deps)
    await l2.open('https://www.netflix.com', 'Netflix')
    expect(deps.openStream).toHaveBeenCalledWith('https://www.netflix.com')
  })
  it('sem Widevine, serviço com DRM no app avisa em vez de abrir uma tela que não toca', async () => {
    const { deps } = make()
    deps.widevine = () => ({ installed: false, msg: 'Widevine não instalado.' })
    deps.streamModes = () => ({ 'Prime Video': 'app' })
    const l = launcherMod.createLauncher(deps)
    expect(await l.open('https://www.primevideo.com', 'Prime Video')).toBe('Widevine não instalado.')
    expect(deps.openStream).not.toHaveBeenCalled()
  })
  it('sem Widevine, YouTube (sem DRM) abre normalmente', async () => {
    const { deps } = make()
    deps.widevine = () => ({ installed: false, msg: 'x' })
    deps.streamModes = () => ({ YouTube: 'app' })
    const l = launcherMod.createLauncher(deps)
    expect(await l.open('https://www.youtube.com/tv', 'YouTube')).toBe('')
    expect(deps.openStream).toHaveBeenCalled()
  })
  it('programa desconhecido', async () => {
    expect(await make().l.launch('notepad')).toBe('Programa desconhecido.')
  })
})
