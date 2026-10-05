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

describe('wrongKeyMsg: chave colada no campo errado', () => {
  const GEMINI = 'AIza' + 'x'.repeat(35)
  const TMDB_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.abc.def'
  const HEX32 = 'a'.repeat(32)
  it('chave do Gemini no campo do TMDB ou do SteamGridDB', () => {
    expect(mod.wrongKeyMsg(GEMINI, 'tmdb')).toMatch(/chave do Gemini/)
    expect(mod.wrongKeyMsg(GEMINI, 'steamgriddb')).toMatch(/chave do Gemini/)
  })
  it('token do TMDB no campo do Gemini ou do SteamGridDB', () => {
    expect(mod.wrongKeyMsg(TMDB_TOKEN, 'gemini')).toMatch(/do TMDB/)
    expect(mod.wrongKeyMsg(TMDB_TOKEN, 'steamgriddb')).toMatch(/do TMDB/)
  })
  it('chave de 32 letras e números no campo do Gemini (é do TMDB ou do SteamGridDB)', () => {
    expect(mod.wrongKeyMsg(HEX32, 'gemini')).toMatch(/TMDB ou do SteamGridDB/)
  })
  it('chave do Google (AIza) também é a do YouTube: nada a avisar no campo do YouTube', () => {
    expect(mod.wrongKeyMsg(GEMINI, 'youtube')).toBe('')
    expect(mod.wrongKeyMsg(TMDB_TOKEN, 'youtube')).toMatch(/do TMDB/)
    expect(mod.wrongKeyMsg(HEX32, 'youtube')).toMatch(/TMDB ou do SteamGridDB/)
  })
  it('chave no campo certo: nada a avisar', () => {
    expect(mod.wrongKeyMsg(GEMINI, 'gemini')).toBe('')
    expect(mod.wrongKeyMsg(TMDB_TOKEN, 'tmdb')).toBe('')
    expect(mod.wrongKeyMsg(HEX32, 'tmdb')).toBe('')
    expect(mod.wrongKeyMsg(HEX32, 'steamgriddb')).toBe('')
  })
})
