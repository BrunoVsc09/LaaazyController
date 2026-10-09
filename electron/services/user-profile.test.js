import { describe, it, expect, vi } from 'vitest'
import mod from './user-profile.js'

const PHOTO = String.raw`C:\Users\ana\Pictures\eu.png`

function make({ saved = {}, files = ['avatar-01.png', 'avatar-02.webp'], saveErr = '', photo = 'data:image/png;base64,AAA' } = {}) {
  let disk = { ...saved }
  const deps = {
    read: vi.fn(async () => disk),
    write: vi.fn(async (d) => { disk = d; return true }),
    systemName: () => 'ana',
    avatarFiles: vi.fn(async () => files),
    image: { save: vi.fn(async () => saveErr), dataUrl: vi.fn(async () => photo) },
    choosePhoto: vi.fn(async () => PHOTO),
  }
  return { u: mod.createUserProfile(deps), deps, disk: () => disk }
}

// Boas-vindas (pedido do Bruno, 2026-10-09)
describe('perfil do usuário: serviço', () => {
  it('primeira vez: nome do Windows, sem foto, boas-vindas por fazer, e as fotos autorais com o endereço', async () => {
    expect(await make().u.get()).toEqual({
      name: 'ana', avatar: null, avatarSrc: '', welcomeDone: false,
      avatars: [{ id: 'avatar-01', src: 'avatars/avatar-01.png' }, { id: 'avatar-02', src: 'avatars/avatar-02.webp' }],
    })
  })
  it('foto autoral escolhida: endereço dela; a do PC: a imagem guardada', async () => {
    expect((await make({ saved: { avatar: { kind: 'builtin', id: 'avatar-02' } } }).u.get()).avatarSrc).toBe('avatars/avatar-02.webp')
    expect((await make({ saved: { avatar: { kind: 'custom' } } }).u.get()).avatarSrc).toBe('data:image/png;base64,AAA')
  })
  it('foto que sumiu (autoral apagada ou a do PC perdida): volta a não ter foto', async () => {
    expect((await make({ saved: { avatar: { kind: 'builtin', id: 'avatar-09' } } }).u.get()).avatar).toBeNull()
    expect((await make({ saved: { avatar: { kind: 'custom' } }, photo: '' }).u.get()).avatar).toBeNull()
  })
  it('mudar nome e foto autoral grava e devolve o perfil novo', async () => {
    const { u, disk } = make()
    const r = await u.set({ name: 'Bruno', avatar: { kind: 'builtin', id: 'avatar-01' } })
    expect(r).toMatchObject({ ok: true, profile: { name: 'Bruno', avatarSrc: 'avatars/avatar-01.png' } })
    expect(disk()).toEqual({ name: 'Bruno', avatar: { kind: 'builtin', id: 'avatar-01' }, welcomeDone: false })
  })
  it('foto autoral que não existe ou mudança inválida: não grava', async () => {
    const { u, deps } = make()
    expect((await u.set({ avatar: { kind: 'builtin', id: 'avatar-77' } })).ok).toBe(false)
    expect((await u.set({ name: '' })).msg).toMatch(/nome/)
    expect(deps.write).not.toHaveBeenCalled()
  })
  it('foto do PC: guarda a imagem (reduzida) e passa a usá-la', async () => {
    const { u, deps } = make()
    const r = await u.setPhoto(PHOTO)
    expect(deps.image.save).toHaveBeenCalledWith(PHOTO)
    expect(r).toMatchObject({ ok: true, profile: { avatar: { kind: 'custom' } } })
  })
  it('foto do PC: só PNG/JPG em caminho de disco; erro ao ler a imagem vira mensagem', async () => {
    const { u, deps } = make()
    expect((await u.setPhoto(String.raw`C:\x\virus.exe`)).ok).toBe(false)
    expect((await u.setPhoto(String.raw`\\servidor\eu.png`)).ok).toBe(false)
    expect(deps.image.save).not.toHaveBeenCalled()
    expect(await make({ saveErr: 'Não consegui ler essa imagem.' }).u.setPhoto(PHOTO)).toEqual({ ok: false, msg: 'Não consegui ler essa imagem.' })
  })
  it('foto pela janela do Windows; cancelar não muda nada', async () => {
    const { u, deps } = make()
    expect((await u.choosePhoto()).ok).toBe(true)
    deps.choosePhoto.mockResolvedValueOnce(null)
    expect(await u.choosePhoto()).toEqual({ ok: false, msg: '' })
  })
  it('terminar as boas-vindas', async () => {
    const { u, disk } = make()
    await u.finish()
    expect(disk().welcomeDone).toBe(true)
  })
})
