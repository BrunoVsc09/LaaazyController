import { describe, it, expect } from 'vitest'
import mod from './user-profile.js'

const { profileOf, applyChange, validName, avatarIds } = mod

// Boas-vindas (pedido do Bruno, 2026-10-09): nome e foto de quem usa o Laaazy
describe('perfil do usuário', () => {
  it('sem nada salvo: o nome do Windows, sem foto e boas-vindas por fazer', () => {
    expect(profileOf({}, 'bruno')).toEqual({ name: 'bruno', avatar: null, welcomeDone: false })
  })
  it('o que foi salvo vence; foto e boas-vindas lidas com cuidado', () => {
    expect(profileOf({ name: 'Bruno', avatar: { kind: 'builtin', id: 'avatar-03' }, welcomeDone: true }, 'x'))
      .toEqual({ name: 'Bruno', avatar: { kind: 'builtin', id: 'avatar-03' }, welcomeDone: true })
    expect(profileOf({ name: 42, avatar: { kind: 'hack' }, welcomeDone: 'sim' }, 'bruno'))
      .toEqual({ name: 'bruno', avatar: null, welcomeDone: false })
  })
  it('nome: 1 a 20 caracteres, sem caracteres de controle, espaços nas pontas saem', () => {
    expect(validName('  Bruno  ')).toBe('Bruno')
    expect(validName('')).toBeNull()
    expect(validName('   ')).toBeNull()
    expect(validName('x'.repeat(21))).toBeNull()
    expect(validName('a\nb')).toBeNull()
    expect(validName(7)).toBeNull()
  })
  it('mudar nome e foto (autoral, minha foto ou nenhuma)', () => {
    const p = profileOf({}, 'bruno')
    expect(applyChange(p, { name: ' Ana ' })).toEqual({ ok: true, profile: { ...p, name: 'Ana' } })
    expect(applyChange(p, { avatar: { kind: 'builtin', id: 'avatar-01' } }).profile.avatar).toEqual({ kind: 'builtin', id: 'avatar-01' })
    expect(applyChange(p, { avatar: { kind: 'custom' } }).profile.avatar).toEqual({ kind: 'custom' })
    expect(applyChange(p, { avatar: null }).profile.avatar).toBeNull()
    expect(applyChange(p, { welcomeDone: true }).profile.welcomeDone).toBe(true)
  })
  it('mudança inválida não muda nada', () => {
    const p = profileOf({}, 'bruno')
    expect(applyChange(p, { name: '' })).toEqual({ ok: false, msg: 'Escolha um nome de 1 a 20 letras.' })
    expect(applyChange(p, { avatar: { kind: 'builtin', id: '../segredo' } }).ok).toBe(false)
    expect(applyChange(p, { avatar: { kind: 'url', id: 'http://x' } }).ok).toBe(false)
    expect(applyChange(p, { idade: 3 }).ok).toBe(false)
  })
  it('fotos autorais: arquivos avatar-*.png/.webp/.jpg da pasta, em ordem', () => {
    expect(avatarIds(['avatar-02.png', 'leia.txt', 'avatar-01.webp', 'avatar-10.jpg', 'foto.png'])).toEqual([
      { id: 'avatar-01', file: 'avatar-01.webp' }, { id: 'avatar-02', file: 'avatar-02.png' }, { id: 'avatar-10', file: 'avatar-10.jpg' },
    ])
  })
})
