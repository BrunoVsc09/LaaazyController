import { describe, it, expect } from 'vitest'
import mod from './volume.js'
import gamepad from '../../shared/gamepad.js'

describe('volume', () => {
  it('teclas de volume do Windows (virtual-key)', () => {
    expect(mod.VK).toEqual({ up: 175, down: 174, mute: 173 })
  })
  // O F20–F22 eram teclas do DS4Windows; no perfil PC do Laaazy-pad, L2/R2 mandam Ctrl+Alt+↓/↑
  it('atalhos globais: só Ctrl+Alt (↑ aumenta, ↓ abaixa, M silencia)', () => {
    const map = Object.fromEntries(mod.SHORTCUTS.map((s) => [s.accel, s.action]))
    expect(map).toEqual({ 'CommandOrControl+Alt+Up': 'up', 'CommandOrControl+Alt+Down': 'down', 'CommandOrControl+Alt+M': 'mute' })
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
