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

describe('editDiff: o que mudou no teclado vira apagar N + digitar texto (tempo real)', () => {
  it('letra nova no fim: só digita ela', () => {
    expect(mod.editDiff('nar', 'naru')).toEqual({ back: 0, text: 'u' })
  })
  it('apagar: N backspaces', () => {
    expect(mod.editDiff('naru', 'nar')).toEqual({ back: 1, text: '' })
  })
  it('limpar: apaga tudo', () => {
    expect(mod.editDiff('naruto', '')).toEqual({ back: 6, text: '' })
  })
  it('troca no meio (raro): apaga até onde mudou e digita o resto', () => {
    expect(mod.editDiff('abc', 'abX')).toEqual({ back: 1, text: 'X' })
  })
  it('nada mudou (ex.: Maiúscula): nada a fazer', () => {
    expect(mod.editDiff('abc', 'abc')).toEqual({ back: 0, text: '' })
  })
})

describe('editCommand: comando que aplica a mudança no campo do site', () => {
  it('backspaces e depois o texto (com o mesmo cuidado do typeCommand)', () => {
    const cmd = mod.editCommand({ back: 2, text: 'oi' })
    expect(cmd.startsWith("$w.SendKeys('{BACKSPACE 2}');")).toBe(true)
    expect(cmd).toContain(mod.typeCommand('oi'))
  })
  it('só apagar, ou só digitar', () => {
    expect(mod.editCommand({ back: 3, text: '' })).toBe("$w.SendKeys('{BACKSPACE 3}')")
    expect(mod.editCommand({ back: 0, text: 'a' })).toBe(mod.typeCommand('a'))
  })
  it('nada a fazer ou valores estranhos: null', () => {
    expect(mod.editCommand({ back: 0, text: '' })).toBeNull()
    expect(mod.editCommand({ back: -1, text: '' })).toBeNull()
    expect(mod.editCommand({ back: 501, text: '' })).toBeNull()
    expect(mod.editCommand({ back: 1.5, text: '' })).toBeNull()
    expect(mod.editCommand({ back: 0, text: 'a\nb' })).toBeNull()
  })
})
