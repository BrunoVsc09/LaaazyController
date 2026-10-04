import { describe, it, expect, vi } from 'vitest'
import mod from './volume.js'

describe('volume service', () => {
  it('manda a linha do PowerShell da ação', () => {
    const send = vi.fn(() => true)
    const v = mod.createVolume({ send })
    expect(v.step('down')).toBe(true)
    expect(send).toHaveBeenCalledWith('$w.SendKeys([char]174);$w.SendKeys([char]174)')
  })
  it('recusa ação desconhecida', () => {
    const send = vi.fn()
    expect(mod.createVolume({ send }).step('format')).toBe(false)
    expect(send).not.toHaveBeenCalled()
  })
})
