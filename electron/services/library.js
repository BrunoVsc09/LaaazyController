// Biblioteca: lista (Steam + Epic + adicionados à mão), abre, adiciona e remove jogos.
// Steam e Epic vêm do disco e voltariam sozinhos: remover um deles só o oculta (hidden-games.json).
const { mergeGames } = require('../core/games/merge')
const { customGame } = require('../core/games/folder')
const { isGameFile, isBrowsable } = require('../core/fs-browse')

const CACHE_MS = 15000
const GAME_URL = /^(steam|com\.epicgames\.launcher):\/\//
const SAVE_FAILED = 'Não consegui salvar a lista de jogos.'

function createLibrary({
  sources, readCustom, writeCustom, readHidden = async () => [], writeHidden = async () => true, scanFolder, chooseExe, chooseDir,
  // onLaunch(id): antes de abrir (Laaazy-pad e perfil do jogo); onLaunched(id): abriu
  exists, openExternal, openPath, spawnDetached, onLaunch = () => {}, onLaunched = () => {}, now = Date.now,
}) {
  // Varrer Steam e Epic lê o disco: o resultado vale por 15s e cai quando a lista muda
  let cache = null
  let cacheAt = 0
  const dropCache = () => { cache = null }

  async function list({ fresh = false } = {}) {
    if (!fresh && cache && now() - cacheAt < CACHE_MS) return cache
    const custom = (await readCustom()).map((g) => ({
      id: g.id, name: g.name, platform: 'Meu PC', launch: { type: 'exe', value: g.exe },
    }))
    const found = await Promise.all(sources.map((s) => s()))
    const hidden = new Set(await readHidden())
    cache = mergeGames(...found, custom).filter((g) => !hidden.has(g.id))
    cacheAt = now()
    return cache
  }

  async function launch(id) {
    const g = (await list()).find((x) => x.id === id)
    if (!g) return { ok: false, msg: 'Esse jogo não está mais na lista. Volte e entre na Biblioteca de novo.' }
    const { type, value } = g.launch
    if (type === 'url') {
      if (!GAME_URL.test(value)) return { ok: false, msg: 'Endereço de abertura inválido para este jogo.' }
      onLaunch(g.id)
      try { await openExternal(value) } catch (e) {
        return { ok: false, msg: `Não consegui abrir pela ${g.platform}: ${e.message}` }
      }
      onLaunched(g.id)
      return { ok: true, msg: '' }
    }
    if (!exists(value)) {
      dropCache()
      return { ok: false, msg: `O arquivo do jogo não existe mais:\n${value}` }
    }
    onLaunch(g.id)
    // Atalho (.lnk) só abre pelo Windows; spawn não executa atalhos
    const err = /\.lnk$/i.test(value) ? await openPath(value) : await spawnDetached(value)
    if (err) return { ok: false, msg: `Não consegui abrir "${g.name}": ${err}` }
    onLaunched(g.id)
    return { ok: true, msg: '' }
  }

  async function addCustom(items) {
    const current = await readCustom()
    let added = 0
    for (const it of items) {
      const g = customGame(it.exe, it.name)
      if (!current.some((x) => x.id === g.id)) { current.push(g); added++ }
    }
    const ok = await writeCustom(current)
    dropCache()
    return { added, ok }
  }

  async function addExe() {
    const exe = await chooseExe()
    if (!exe) return { ok: true, added: 0, msg: '' }
    const { added, ok } = await addCustom([{ exe }])
    if (!ok) return { ok: false, added: 0, msg: SAVE_FAILED }
    return { ok: true, added, msg: added ? '' : 'Esse jogo já estava na lista.' }
  }

  // Pelo navegador de pastas do Laaazy (controle): caminho já escolhido na tela
  async function addExePath(exe) {
    if (!isBrowsable(exe) || !isGameFile(exe) || !exists(exe)) return { ok: false, added: 0, msg: 'Escolha um arquivo .exe ou atalho (.lnk) que exista.' }
    const g = customGame(exe)
    const { added, ok } = await addCustom([{ exe }])
    if (!ok) return { ok: false, added: 0, msg: SAVE_FAILED }
    return { ok: true, added, msg: added ? `"${g.name}" adicionado.` : 'Esse jogo já estava na lista.' }
  }

  async function addFolder() {
    const dir = await chooseDir()
    if (!dir) return { ok: true, added: 0, msg: '' }
    return addFolderPath(dir)
  }

  async function addFolderPath(dir) {
    if (!isBrowsable(dir)) return { ok: false, added: 0, msg: 'Pasta inválida.' }
    const found = await scanFolder(dir)
    if (!found.length) return { ok: true, added: 0, msg: 'Não achei nenhum jogo nessa pasta.' }
    const { added, ok } = await addCustom(found)
    if (!ok) return { ok: false, added: 0, msg: SAVE_FAILED }
    return { ok: true, added, msg: added ? `${added} jogo(s) adicionado(s).` : 'Todos os jogos dessa pasta já estavam na lista.' }
  }

  async function remove(id) {
    const custom = await readCustom()
    const hidden = await readHidden()
    const ok = custom.some((g) => g.id === id)
      ? await writeCustom(custom.filter((g) => g.id !== id))
      : hidden.includes(id) || await writeHidden([...hidden, id])
    dropCache()
    return { ok, msg: ok ? '' : SAVE_FAILED }
  }

  return { list, launch, addExe, addFolder, addExePath, addFolderPath, remove }
}

module.exports = { createLibrary }
