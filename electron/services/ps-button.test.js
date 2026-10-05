import { describe, it, expect, vi } from 'vitest'
import mod from './ps-button.js'

function make({ closes = true, desktop = false } = {}) {
  let t = 0
  const deps = {
    desktopActive: () => desktop,
    foreground: { closeAndHome: vi.fn(async () => true) },
    home: vi.fn(),
    psClosesApp: () => closes,
    ensureDs4: vi.fn(),
    notifyTested: vi.fn(),
    now: () => t,
  }
  return { ps: mod.createPsButton(deps), deps, advance: (ms) => { t += ms } }
}

describe('botão PS', () => {
  it('padrão: mata o que está na frente e volta ao Início', async () => {
    const { ps, deps } = make()
    expect(await ps.press()).toBe('closed')
    expect(deps.foreground.closeAndHome).toHaveBeenCalled()
    expect(deps.home).not.toHaveBeenCalled()
  })
  it('opção "como console": só volta ao Início, sem fechar o jogo', async () => {
    const { ps, deps } = make({ closes: false })
    expect(await ps.press()).toBe('home')
    expect(deps.home).toHaveBeenCalled()
    expect(deps.foreground.closeAndHome).not.toHaveBeenCalled()
  })
  it('modo teste: o aperto só confirma que o PS chegou, sem fechar nada', async () => {
    const { ps, deps } = make()
    ps.startTest()
    expect(deps.ensureDs4).toHaveBeenCalled() // o PS só chega se o DS4Windows estiver aberto
    expect(await ps.press()).toBe('tested')
    expect(deps.notifyTested).toHaveBeenCalled()
    expect(deps.foreground.closeAndHome).not.toHaveBeenCalled()
    expect(await ps.press()).toBe('closed') // depois do teste, volta ao normal
  })
  it('na Área de trabalho: só volta ao Início, sem matar o que está na frente', async () => {
    const { ps, deps } = make({ desktop: true })
    expect(await ps.press()).toBe('home')
    expect(deps.home).toHaveBeenCalled()
    expect(deps.foreground.closeAndHome).not.toHaveBeenCalled()
  })
  it('o teste expira em 15 segundos', async () => {
    const { ps, advance } = make()
    ps.startTest()
    advance(15001)
    expect(await ps.press()).toBe('closed')
  })
})
