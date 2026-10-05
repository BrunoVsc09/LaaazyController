import { describe, it, expect } from 'vitest'
import mod from './power.js'

describe('power: comandos', () => {
  it('tudo que mexe no PC pede confirmação; fechar o app não', () => {
    for (const a of ['suspend', 'shutdown', 'shutdown_3h', 'shutdown_2h', 'shutdown_cancel']) expect(mod.needsConfirm(a), a).toBe(true)
    expect(mod.needsConfirm('quit')).toBe(false)
  })
  it('desligar agendado (pelo próprio Windows: vale mesmo com o Laaazy fechado) e cancelar', () => {
    expect(mod.COMMANDS.shutdown_3h).toEqual({ cmd: 'shutdown', args: ['/s', '/t', '10800'] })
    expect(mod.COMMANDS.shutdown_2h).toEqual({ cmd: 'shutdown', args: ['/s', '/t', '7200'] })
    expect(mod.COMMANDS.shutdown_cancel).toEqual({ cmd: 'shutdown', args: ['/a'] })
    expect(mod.delaySeconds('shutdown_3h')).toBe(10800)
    expect(mod.delaySeconds('shutdown')).toBe(0)
  })
  it('clockText: hora e minuto com dois dígitos', () => {
    expect(mod.clockText(new Date(2026, 9, 5, 2, 7))).toBe('02:07')
    expect(mod.clockText(new Date(2026, 9, 5, 23, 45))).toBe('23:45')
  })
  it('comando do Windows de cada ação', () => {
    expect(mod.COMMANDS.shutdown).toEqual({ cmd: 'shutdown', args: ['/s', '/t', '0'] })
    expect(mod.COMMANDS.suspend).toEqual({ cmd: 'rundll32.exe', args: ['powrprof.dll,SetSuspendState', '0', '1', '0'] })
  })
})

describe('loginItemFor (abrir junto com o Windows)', () => {
  it('.exe portátil: usa o arquivo .exe real, não a pasta temporária onde ele roda', () => {
    expect(mod.loginItemFor({ isPackaged: true, execPath: 'C:\\Temp\\x\\Laaazy.exe', portableFile: 'D:\\Apps\\Laaazy.exe', appPath: '' }))
      .toEqual({ path: 'D:\\Apps\\Laaazy.exe', args: [] })
  })
  it('app instalado: o próprio executável', () => {
    expect(mod.loginItemFor({ isPackaged: true, execPath: 'C:\\L\\Laaazy.exe', portableFile: '', appPath: '' }))
      .toEqual({ path: 'C:\\L\\Laaazy.exe', args: [] })
  })
  it('desenvolvimento (pnpm app): electron.exe + pasta do projeto', () => {
    expect(mod.loginItemFor({ isPackaged: false, execPath: 'C:\\p\\electron.exe', portableFile: '', appPath: 'C:\\p' }))
      .toEqual({ path: 'C:\\p\\electron.exe', args: ['C:\\p'] })
  })
})
