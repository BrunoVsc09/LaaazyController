import { describe, it, expect } from 'vitest'
import mod from './typing.js'

const b64 = (s) => Buffer.from(s, 'utf8').toString('base64')

describe('typeCommand (digitar no programa da frente)', () => {
  it('o texto vai codificado em base64, nunca cru no comando', () => {
    const cmd = mod.typeCommand('minhaSenha123')
    expect(cmd).toContain(b64('minhaSenha123'))
    expect(cmd).not.toContain('minhaSenha123')
  })
  it('texto feito para virar comando continua sendo só texto', () => {
    const evil = "'; Remove-Item C:\\ -Recurse; '"
    const cmd = mod.typeCommand(evil)
    expect(cmd).not.toContain('Remove-Item')
    expect(cmd).toContain(b64(evil))
  })
  it('protege os caracteres especiais do SendKeys e cola os acentos', () => {
    const cmd = mod.typeCommand('a')
    expect(cmd).toContain("-replace '([+^%~(){}\\[\\]])','{$1}'")
    expect(cmd).toContain('Set-Clipboard')
    expect(cmd).toContain("SendKeys('^v')")
  })
  it('devolve o que estava na área de transferência antes', () => {
    const cmd = mod.typeCommand('ç')
    expect(cmd).toContain('$o=Get-Clipboard')
    expect(cmd).toContain('if($o){Set-Clipboard -Value $o}')
  })
  it('recusa vazio, longo demais ou com caracteres de controle', () => {
    expect(mod.typeCommand('')).toBeNull()
    expect(mod.typeCommand('x'.repeat(501))).toBeNull()
    expect(mod.typeCommand('a\nb')).toBeNull()
    expect(mod.typeCommand(null)).toBeNull()
  })
})
