import { describe, it, expect, vi } from 'vitest'
import mod from './cursor-lock.js'

function make({ enabled = true, rect = { x: 0, y: 0, width: 1920, height: 1080 } } = {}) {
  const deps = { send: vi.fn(), bounds: vi.fn(() => rect), enabled: () => enabled }
  return { lock: mod.createCursorLock(deps), deps }
}

describe('cursorLock', () => {
  it('Laaazy na frente: prende o cursor no retângulo da janela', () => {
    const { lock, deps } = make()
    lock.lock()
    expect(deps.send).toHaveBeenCalledWith('[FG]::Clip(0,0,1920,1080)')
  })
  it('opção desligada em Configurações: solta em vez de prender', () => {
    const { lock, deps } = make({ enabled: false })
    lock.lock()
    expect(deps.send).toHaveBeenCalledWith('[FG]::Unclip()')
  })
  it('sem janela (ou retângulo inválido): não prende', () => {
    const { lock, deps } = make({ rect: null })
    lock.lock()
    expect(deps.send).not.toHaveBeenCalled()
  })
  it('Laaazy saiu da frente, minimizou ou fechou: solta', () => {
    const { lock, deps } = make()
    lock.unlock()
    expect(deps.send).toHaveBeenCalledWith('[FG]::Unclip()')
  })
})
