import { describe, it, expect } from 'vitest'
import mod from './focus.js'

describe('hwndFrom e focusCommand', () => {
  it('lê o identificador da janela (HWND) do buffer do Electron', () => {
    const b = Buffer.alloc(8)
    b.writeBigUInt64LE(123456789n)
    expect(mod.hwndFrom(b)).toBe('123456789')
    const b4 = Buffer.alloc(4)
    b4.writeUInt32LE(42)
    expect(mod.hwndFrom(b4)).toBe('42')
    expect(mod.hwndFrom(null)).toBeNull()
  })
  it('comando do PowerShell só com número (nada de texto vindo de fora)', () => {
    expect(mod.focusCommand('123')).toBe('[FG]::Focus([IntPtr]123)')
    expect(mod.focusCommand('1; Remove-Item C:\\')).toBeNull()
    expect(mod.focusCommand('')).toBeNull()
  })
})

describe('watchStep (volta automática ao Laaazy)', () => {
  const ctx = { selfPid: 10, ownPids: [10, 11] }
  const fg = (name, pid = 99) => ({ name, pid })
  const S = 1000
  it('jogo da Steam: espera o jogo aparecer; quando ele fecha e sobra o Steam, volta', () => {
    let st = mod.startWatch(0)
    let r = mod.watchStep(st, fg('steam'), ctx, 2 * S)          // Steam abrindo o jogo
    expect(r.action).toBeNull()
    r = mod.watchStep(r.state, fg('Hades'), ctx, 10 * S)        // jogo na frente
    expect(r.state.phase).toBe('away')
    r = mod.watchStep(r.state, fg('Hades'), ctx, 60 * S)        // jogando
    expect(r.action).toBeNull()
    r = mod.watchStep(r.state, fg('steamwebhelper'), ctx, 61 * S) // jogo fechou
    expect(r).toEqual({ state: { phase: 'idle' }, action: 'return' })
  })
  it('Edge: quando fecha e sobra a área de trabalho, volta', () => {
    let r = mod.watchStep(mod.startWatch(0), fg('msedge'), ctx, S)
    r = mod.watchStep(r.state, fg('explorer'), ctx, 5 * S)
    expect(r.action).toBe('return')
  })
  it('se o próprio Laaazy já está na frente, não faz nada além de parar de vigiar', () => {
    let r = mod.watchStep(mod.startWatch(0), fg('msedge'), ctx, S)
    r = mod.watchStep(r.state, fg('Laaazy', 11), ctx, 2 * S)
    expect(r.action).toBe('return')
  })
  it('se o jogo não aparece em 90 segundos, desiste e traz o Laaazy de volta (ele foi minimizado ao abrir o jogo)', () => {
    const r = mod.watchStep(mod.startWatch(0), fg('steam'), ctx, 91 * S)
    expect(r).toEqual({ state: { phase: 'idle' }, action: 'return' })
  })
  it('parado: não faz nada', () => {
    expect(mod.watchStep({ phase: 'idle' }, fg('explorer'), ctx, 0)).toEqual({ state: { phase: 'idle' }, action: null })
  })
})
