import { describe, it, expect, vi } from 'vitest'
import mod from './text-entry.js'

function make({ fg = ['111'] } = {}) {
  const queue = [...fg]
  const deps = {
    fgHwnd: vi.fn(async () => queue.length > 1 ? queue.shift() : queue[0]),
    showOverlay: vi.fn(),
    hideOverlay: vi.fn(),
    focusWindow: vi.fn(),
    typeText: vi.fn(() => true),
    sleep: vi.fn(async () => {}),
  }
  return { t: mod.createTextEntry(deps), deps }
}

describe('teclado por cima de outro programa', () => {
  it('abrir: guarda a janela da frente e mostra o teclado', async () => {
    const { t, deps } = make()
    await t.open()
    expect(deps.fgHwnd).toHaveBeenCalled()
    expect(deps.showOverlay).toHaveBeenCalled()
  })
  it('pronto: esconde o teclado, espera o Edge voltar e digita', async () => {
    const { t, deps } = make({ fg: ['111', '111'] })
    await t.open()
    expect(await t.submit('netflix')).toBe(true)
    expect(deps.hideOverlay).toHaveBeenCalled()
    expect(deps.focusWindow).not.toHaveBeenCalled() // o Edge voltou sozinho
    expect(deps.typeText).toHaveBeenCalledWith('netflix')
    expect(deps.hideOverlay.mock.invocationCallOrder[0]).toBeLessThan(deps.typeText.mock.invocationCallOrder[0])
  })
  it('se o Edge não voltou sozinho para a frente, traz ele antes de digitar', async () => {
    const { t, deps } = make({ fg: ['111', '999'] })
    await t.open()
    await t.submit('abc')
    expect(deps.focusWindow).toHaveBeenCalledWith('111')
    expect(deps.typeText).toHaveBeenCalled()
  })
  // Regressão (2026-10-08, reproduzido no Edge): com 250 ms, a janela do Edge já tinha voltado,
  // mas o site ainda não tinha reselecionado o campo, e as letras se perdiam
  it('depois que o Edge volta, espera o site reselecionar o campo (≥ 700 ms) antes de digitar', async () => {
    for (const fg of [['111', '111'], ['111', '999']]) {
      const { t, deps } = make({ fg })
      await t.open()
      await t.submit('oi')
      const typedAt = deps.typeText.mock.invocationCallOrder[0]
      const lastSleep = deps.sleep.mock.calls.filter((_, i) => deps.sleep.mock.invocationCallOrder[i] < typedAt).at(-1)
      expect(lastSleep[0]).toBeGreaterThanOrEqual(700)
    }
  })
  it('janela da frente desconhecida (consulta ao Windows falhou): não puxa o foco à toa', async () => {
    // puxar o foco usa o truque do Alt, e um Alt no Edge tira o foco da página (a busca fecha)
    const { t, deps } = make({ fg: ['111', ''] })
    await t.open()
    await t.submit('oi')
    expect(deps.focusWindow).not.toHaveBeenCalled()
    expect(deps.typeText).toHaveBeenCalledWith('oi')
  })
  it('cancelar: só esconde, não digita nada', async () => {
    const { t, deps } = make()
    await t.open()
    t.cancel()
    expect(deps.hideOverlay).toHaveBeenCalled()
    expect(await t.submit('abc')).toBe(false) // sem janela guardada depois de cancelar
    expect(deps.typeText).not.toHaveBeenCalled()
  })
  it('texto vazio ou inválido: só fecha', async () => {
    const { t, deps } = make()
    await t.open()
    expect(await t.submit('')).toBe(false)
    expect(deps.hideOverlay).toHaveBeenCalled()
    expect(deps.typeText).not.toHaveBeenCalled()
  })
  it('pronto sem ter aberto: nada acontece', async () => {
    const { t, deps } = make()
    expect(await t.submit('abc')).toBe(false)
    expect(deps.typeText).not.toHaveBeenCalled()
  })
})
