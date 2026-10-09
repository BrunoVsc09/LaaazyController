// Perfil de quem usa o Laaazy (boas-vindas): nome, foto e se as boas-vindas já foram feitas. Sem I/O.
// Foto: { kind: 'builtin', id: 'avatar-01' } (autoral, em out/avatars), { kind: 'custom' } (a do PC,
// guardada pelo Laaazy) ou null (a letra do nome).
const CONTROL = /[\u0000-\u001f\u007f]/
const AVATAR_ID = /^avatar-[a-z0-9-]{1,30}$/
const AVATAR_FILE = /^(avatar-[a-z0-9-]{1,30})\.(png|webp|jpe?g)$/i
// Foto padrão de quem ainda não escolheu (ou perdeu a sua): o logo do Laaazy
const DEFAULT_AVATAR = 'avatar-01'

function validName(v) {
  if (typeof v !== 'string') return null
  const name = v.trim()
  return name.length >= 1 && name.length <= 20 && !CONTROL.test(name) ? name : null
}

function validAvatar(a) {
  if (a === null) return true
  if (!a || typeof a !== 'object') return false
  if (a.kind === 'custom') return Object.keys(a).length === 1
  return a.kind === 'builtin' && Object.keys(a).length === 2 && AVATAR_ID.test(String(a.id))
}

// O perfil a partir do que está salvo; o nome do Windows quando não há outro
function profileOf(saved, systemName) {
  const s = saved && typeof saved === 'object' ? saved : {}
  return {
    name: validName(s.name) || systemName,
    avatar: validAvatar(s.avatar) && s.avatar ? s.avatar : null,
    welcomeDone: s.welcomeDone === true,
  }
}

const FIELDS = ['name', 'avatar', 'welcomeDone']

// Aplica { name?, avatar?, welcomeDone? }; qualquer parte inválida recusa tudo
function applyChange(profile, change) {
  if (!change || typeof change !== 'object' || !Object.keys(change).length) return { ok: false, msg: 'Nada para mudar.' }
  if (Object.keys(change).some((k) => !FIELDS.includes(k))) return { ok: false, msg: 'Mudança desconhecida.' }
  const next = { ...profile }
  if ('name' in change) {
    const name = validName(change.name)
    if (!name) return { ok: false, msg: 'Escolha um nome de 1 a 20 letras.' }
    next.name = name
  }
  if ('avatar' in change) {
    if (!validAvatar(change.avatar)) return { ok: false, msg: 'Foto inválida.' }
    next.avatar = change.avatar
  }
  if ('welcomeDone' in change) {
    if (typeof change.welcomeDone !== 'boolean') return { ok: false, msg: 'Mudança desconhecida.' }
    next.welcomeDone = change.welcomeDone
  }
  return { ok: true, profile: next }
}

// Fotos autorais que vêm com o app (pasta avatars): avatar-NN.png/.webp/.jpg, em ordem
function avatarIds(files) {
  return files
    .map((f) => AVATAR_FILE.exec(f))
    .filter(Boolean)
    .map((m) => ({ id: m[1].toLowerCase(), file: m[0] }))
    .sort((a, b) => a.id.localeCompare(b.id, 'pt', { numeric: true }))
}

module.exports = { validName, validAvatar, profileOf, applyChange, avatarIds, DEFAULT_AVATAR }
