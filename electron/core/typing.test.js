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
  // Pedido do Bruno (2026-10-08): L1/R1 andam com o cursor e R2 é o Enter (pesquisar)
  it('L1/R1: move o cursor do campo para trás ou para a frente', () => {
    expect(mod.editCommand({ move: -1 })).toBe("$w.SendKeys('{LEFT 1}')")
    expect(mod.editCommand({ move: 2 })).toBe("$w.SendKeys('{RIGHT 2}')")
  })
  it('R2: Enter (depois do resto, para pesquisar o que foi digitado)', () => {
    expect(mod.editCommand({ enter: true })).toBe("$w.SendKeys('{ENTER}')")
    expect(mod.editCommand({ back: 1, text: '', enter: true })).toBe("$w.SendKeys('{BACKSPACE 1}');$w.SendKeys('{ENTER}')")
  })
  it('limpar com o cursor no meio: vai ao fim e apaga tudo', () => {
    expect(mod.editCommand({ move: 3, back: 6 })).toBe("$w.SendKeys('{RIGHT 3}');$w.SendKeys('{BACKSPACE 6}')")
  })
  it('nada a fazer ou valores estranhos: null', () => {
    expect(mod.editCommand({ back: 0, text: '' })).toBeNull()
    expect(mod.editCommand({})).toBeNull()
    expect(mod.editCommand({ back: -1, text: '' })).toBeNull()
    expect(mod.editCommand({ back: 501, text: '' })).toBeNull()
    expect(mod.editCommand({ back: 1.5, text: '' })).toBeNull()
    expect(mod.editCommand({ back: 0, text: 'a\nb' })).toBeNull()
    expect(mod.editCommand({ move: 501 })).toBeNull()
    expect(mod.editCommand({ move: 0.5 })).toBeNull()
    expect(mod.editCommand({ enter: 'sim' })).toBeNull()
    expect(mod.editCommand(null)).toBeNull()
  })
})

describe('validEdit: o que pode chegar da tela', () => {
  it('aceita só números inteiros, texto sem controle e enter booleano', () => {
    expect(mod.validEdit({ move: -2, back: 1, text: 'a', enter: false })).toBe(true)
    expect(mod.validEdit({ text: 'a' })).toBe(true)
    expect(mod.validEdit({ back: '1' })).toBe(false)
    expect(mod.validEdit({ text: 'a\u0007' })).toBe(false)
    expect(mod.validEdit('a')).toBe(false)
  })
})
