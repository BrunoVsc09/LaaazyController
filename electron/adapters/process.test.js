import { describe, it, expect } from 'vitest'
import mod from './process.js'

// Rodar como administrador (instalador do Equalizer APO): PowerShell Start-Process -Verb RunAs
describe('elevatedCommand: comando do PowerShell', () => {
  it('pede administrador, espera terminar e devolve o código de saída do programa', () => {
    const cmd = mod.elevatedCommand('C:\\Temp\\setup.exe', ['/S'])
    expect(cmd).toContain("Start-Process -FilePath 'C:\\Temp\\setup.exe' -ArgumentList '/S' -Verb RunAs -Wait -PassThru")
    expect(cmd).toContain('exit $p.ExitCode')
  })
  it('aspas simples no caminho não quebram o comando (usuário O\'Brien)', () => {
    const cmd = mod.elevatedCommand("C:\\Users\\O'Brien\\setup.exe", [])
    expect(cmd).toContain("-FilePath 'C:\\Users\\O''Brien\\setup.exe'")
    expect(cmd).not.toContain('-ArgumentList')
  })
  it('"Não" no aviso do Windows vira o código 1223 (ERROR_CANCELLED)', () => {
    expect(mod.elevatedCommand('C:\\x.exe', [])).toMatch(/NativeErrorCode -eq 1223\) \{ exit 1223 \}/)
  })
})

describe('elevatedResult: o que aconteceu', () => {
  it('0 = deu certo', () => {
    expect(mod.elevatedResult(0)).toEqual({ ok: true, canceled: false, code: 0 })
  })
  it('1223 = a pessoa disse "Não" no aviso do Windows', () => {
    expect(mod.elevatedResult(1223)).toEqual({ ok: false, canceled: true, code: 1223 })
  })
  it('outro código = erro do programa', () => {
    expect(mod.elevatedResult(2)).toEqual({ ok: false, canceled: false, code: 2 })
  })
})
