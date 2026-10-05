import { describe, it, expect, vi } from 'vitest'
import mod from './desktop.js'

function make({ apply = { ok: true, msg: 'Perfil "PC" ativo no DS4Windows.' } } = {}) {
  const deps = {
    ds4: { ensureRunning: vi.fn(async () => {}), applyFor: vi.fn(async () => apply) },
    returnWatch: { stop: vi.fn() },
    minimize: vi.fn(),
  }
  return { d: mod.createDesktop(deps), deps }
}

describe('Área de trabalho', () => {
  it('entra: perfil da Área de trabalho no DS4Windows, para a volta automática e minimiza o Laaazy', async () => {
    const { d, deps } = make()
    expect(d.isActive()).toBe(false)
    expect(await d.enter()).toEqual({ ok: true, msg: '' })
    expect(deps.ds4.ensureRunning).toHaveBeenCalled()
    expect(deps.ds4.applyFor).toHaveBeenCalledWith('desktop')
    expect(deps.returnWatch.stop).toHaveBeenCalled()
    expect(deps.minimize).toHaveBeenCalled()
    expect(d.isActive()).toBe(true)
  })
  it('perfil não trocou: minimiza do mesmo jeito e avisa o motivo', async () => {
    const { d, deps } = make({ apply: { ok: false, msg: 'Não achei o DS4Windows.' } })
    expect(await d.enter()).toEqual({ ok: false, msg: 'Não achei o DS4Windows.' })
    expect(deps.minimize).toHaveBeenCalled()
  })
  it('voltar ao Laaazy sai da Área de trabalho', async () => {
    const { d } = make()
    await d.enter()
    d.leave()
    expect(d.isActive()).toBe(false)
  })
})
