import { describe, it, expect } from 'vitest'
import mod from './volume.js'
import gamepad from '../../shared/gamepad.js'

describe('volume', () => {
  it('teclas de volume do Windows (virtual-key)', () => {
    expect(mod.VK).toEqual({ up: 175, down: 174, mute: 173 })
  })
  it('atalhos globais: F20 silencia, F21 abaixa, F22 aumenta (e Ctrl+Alt no teclado)', () => {
    const map = Object.fromEntries(mod.SHORTCUTS.map((s) => [s.accel, s.action]))
    expect(map).toMatchObject({ F20: 'mute', F21: 'down', F22: 'up', 'CommandOrControl+Alt+Up': 'up', 'CommandOrControl+Alt+Down': 'down', 'CommandOrControl+Alt+M': 'mute' })
  })
  it('psLine: cada passo aperta a tecla 2 vezes (4%); mudo aperta 1 vez', () => {
    expect(mod.psLine('up')).toBe('$w.SendKeys([char]175);$w.SendKeys([char]175)')
    expect(mod.psLine('mute')).toBe('$w.SendKeys([char]173)')
  })
  it('ação desconhecida não vira comando', () => {
    expect(mod.psLine('rm -rf')).toBeNull()
  })
  it('L2 e R2 no controle', () => {
    expect([gamepad.BTN.L2, gamepad.BTN.R2]).toEqual([6, 7])
  })
})
