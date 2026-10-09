// Perfil de quem usa o Laaazy (boas-vindas): nome, foto e boas-vindas feitas. Guarda em user.json.
// Foto do PC: o adaptador de imagem reduz e guarda uma cópia; nunca se lê o arquivo de origem de novo.
const rules = require('../core/user-profile')
const { isBrowsable, isImageFile } = require('../core/fs-browse')

// avatarFiles(): arquivos da pasta avatars (fotos autorais que vêm com o app)
// image: { save(caminho) → '' ou mensagem, dataUrl() → foto guardada ('' se não há) }
function createUserProfile({ read, write, systemName, avatarFiles, image, choosePhoto }) {
  const avatars = async () => rules.avatarIds(await avatarFiles().catch(() => []))
    .map((a) => ({ id: a.id, src: 'avatars/' + a.file }))

  // Perfil para a tela: com o endereço da foto (some se a foto não existe mais)
  async function get() {
    const p = rules.profileOf(await read(), systemName())
    const list = await avatars()
    let avatarSrc = ''
    if (p.avatar?.kind === 'builtin') avatarSrc = list.find((a) => a.id === p.avatar.id)?.src ?? ''
    if (p.avatar?.kind === 'custom') avatarSrc = await image.dataUrl()
    return { ...p, avatar: avatarSrc ? p.avatar : null, avatarSrc, avatars: list }
  }

  async function set(change) {
    const current = rules.profileOf(await read(), systemName())
    const r = rules.applyChange(current, change)
    if (!r.ok) return r
    if (r.profile.avatar?.kind === 'builtin' && !(await avatars()).some((a) => a.id === r.profile.avatar.id)) {
      return { ok: false, msg: 'Essa foto não existe.' }
    }
    if (!(await write(r.profile))) return { ok: false, msg: 'Não consegui salvar o perfil.' }
    return { ok: true, profile: await get() }
  }

  // Foto do PC (escolhida com o controle ou pela janela do Windows): só PNG/JPG em disco local
  async function setPhoto(file) {
    if (!isBrowsable(file) || !isImageFile(file)) return { ok: false, msg: 'Escolha uma foto PNG ou JPG.' }
    const err = await image.save(file)
    if (err) return { ok: false, msg: err }
    return set({ avatar: { kind: 'custom' } })
  }

  async function choosePhotoWindows() {
    const file = await choosePhoto()
    return file ? setPhoto(file) : { ok: false, msg: '' }
  }

  const finish = () => set({ welcomeDone: true })

  return { get, set, setPhoto, choosePhoto: choosePhotoWindows, finish }
}

module.exports = { createUserProfile }
