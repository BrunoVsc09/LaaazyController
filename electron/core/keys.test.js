import { describe, it, expect } from 'vitest'
import mod from './keys.js'

describe('cleanKey (chaves de API coladas)', () => {
  it('tira espaços, quebras de linha e tabs em qualquer lugar', () => {
    expect(mod.cleanKey('  abc def\n123\t456 \r\n')).toBe('abcdef123456')
  })
  it('tira caracteres invisíveis que vêm ao copiar da página', () => {
    expect(mod.cleanKey('​abc‌‍﻿def ')).toBe('abcdef')
  })
  it('tira aspas em volta', () => {
    expect(mod.cleanKey('"abc"')).toBe('abc')
    expect(mod.cleanKey("'abc'")).toBe('abc')
    expect(mod.cleanKey('“abc”')).toBe('abc')
  })
  it('não é texto: vazio', () => {
    expect(mod.cleanKey(null)).toBe('')
    expect(mod.cleanKey(42)).toBe('')
  })
})
