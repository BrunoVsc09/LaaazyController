import { describe, it, expect } from 'vitest'
import mod from './power.js'

describe('power: comandos', () => {
  it('suspender e desligar pedem confirmação; fechar o app não', () => {
    expect(mod.needsConfirm('suspend')).toBe(true)
    expect(mod.needsConfirm('shutdown')).toBe(true)
    expect(mod.needsConfirm('quit')).toBe(false)
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
