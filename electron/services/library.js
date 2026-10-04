// Biblioteca: lista (Steam + Epic + adicionados à mão), abre, adiciona e remove jogos.
const { mergeGames } = require('../core/games/merge')
const { customGame } = require('../core/games/folder')

const CACHE_MS = 15000
const GAME_URL = /^(steam|com\.epicgames\.launcher):\/\//
const SAVE_FAILED = 'Não consegui salvar a lista de jogos.'

function createLibrary({
  sources, readCustom, writeCustom, scanFolder, chooseExe, chooseDir,
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
    cache = mergeGames(...found, custom)
    cacheAt = now()
    return cache
  }

  async function launch(id) {
    const g = (await list()).find((x) => x.id === id)
    if (!g) return { ok: false, msg: 'Esse jogo não está mais na lista. Volte e entre na Biblioteca de novo.' }
    const { type, value } = g.launch
    if (type === 'url') {
      if (!GAME_URL.test(value)) return { ok: false, msg: 'Endereço de abertura inválido para este jogo.' }
      onLaunch()
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
    onLaunch()
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

  async function addFolder() {
    const dir = await chooseDir()
    if (!dir) return { ok: true, added: 0, msg: '' }
    const found = await scanFolder(dir)
    if (!found.length) return { ok: true, added: 0, msg: 'Não achei nenhum jogo nessa pasta.' }
    const { added, ok } = await addCustom(found)
    if (!ok) return { ok: false, added: 0, msg: SAVE_FAILED }
    return { ok: true, added, msg: added ? `${added} jogo(s) adicionado(s).` : 'Todos os jogos dessa pasta já estavam na lista.' }
  }

  async function remove(id) {
    const ok = await writeCustom((await readCustom()).filter((g) => g.id !== id))
    dropCache()
    return { ok, msg: ok ? '' : SAVE_FAILED }
  }

  return { list, launch, addExe, addFolder, remove }
}

module.exports = { createLibrary }
