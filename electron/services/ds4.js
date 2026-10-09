// Troca o perfil do controle (Laaazy-pad) por card e por jogo, abre e fecha o Laaazy-pad.
// Tudo passa por uma fila: duas trocas nunca rodam ao mesmo tempo.
// (O nome "ds4" ficou do tempo do DS4Windows; renomear é outra refatoração.)
const { createQueue } = require('../core/queue')
const { mergeConfig, validateChange, gameProfileFor, profileMissing } = require('../core/ds4-config')
const pad = require('../core/pad-profile')

const NOT_FOUND = 'Não achei o Laaazy-pad. Escolha a pasta dele em Configurações.'
const HINT = 'Se nada mudou, veja se o controle está conectado e se o Laaazy-pad está aberto.'

// readyDelayMs: quanto esperar depois de abrir até o programa aceitar comandos
function createDs4({ cli, getExe, readCfg, writeCfg, sleep, readyDelayMs = 300 }) {
  const queue = createQueue({ timeoutMs: 20000, onTimeout: () => ({ ok: false, msg: 'A troca demorou demais e foi cancelada.' }) })
  const config = async () => mergeConfig(await readCfg())

  async function startIfNeeded(exe) {
    if (await cli.isRunning()) return ''
    const err = await cli.start(exe)
    if (!err) await sleep(readyDelayMs)
    return err
  }

  async function load(name) {
    if (!name) return { ok: true, msg: 'Sem troca de perfil.' }
    const exe = await getExe()
    if (!exe) return { ok: false, msg: NOT_FOUND }
    const { profiles } = await cli.listProfiles(exe)
    if (!profiles.includes(name)) return { ok: false, msg: profileMissing(name) }
    const startErr = await startIfNeeded(exe)
    if (startErr) return { ok: false, msg: 'Não consegui abrir o Laaazy-pad: ' + startErr }
    const sendErr = await cli.loadProfile(exe, name)
    if (sendErr) return { ok: false, msg: 'Erro ao trocar o perfil: ' + sendErr }
    const now = await cli.queryProfile(exe)
    if (now === null) return { ok: true, msg: `Enviei o perfil "${name}", mas não consegui confirmar. ${HINT}` }
    if (now.toLowerCase().includes(name.toLowerCase())) return { ok: true, msg: `Perfil "${name}" ativo no Laaazy-pad.` }
    return { ok: false, msg: `Enviei "${name}", mas o Laaazy-pad respondeu "${now.slice(0, 60)}". ${HINT}` }
  }

  const apply = (name) => queue.run(() => load(name))
  const applyFor = async (key) => apply((await config())[key])
  const applyForGame = async (gameId) => apply(gameProfileFor(await config(), gameId))

  async function get() {
    const exe = await getExe()
    const { dir, profiles } = exe ? await cli.listProfiles(exe) : { dir: null, profiles: [] }
    const current = exe && (await cli.isRunning()) ? (await cli.queryProfile(exe)) || '' : ''
    return { profiles, dir, config: await config(), cmd: cli.cmdName(exe), current }
  }

  async function set(key, value) {
    const exe = await getExe()
    const { profiles } = exe ? await cli.listProfiles(exe) : { profiles: [] }
    const check = validateChange(key, value || '', profiles)
    if (!check.ok) return check
    await writeCfg({ ...(await readCfg()), [key]: value || '' })
    return apply(value)
  }

  const ensureRunning = () => queue.run(async () => {
    const exe = await getExe()
    if (exe) await startIfNeeded(exe)
  }).catch(() => {})

  // Comando oficial "shutdown"; se continuar aberto, pede para o Windows fechar
  const shutdown = () => queue.run(async () => {
    if (!(await cli.isRunning())) return
    await cli.shutdown(await getExe())
    await sleep(1500)
    if (await cli.isRunning()) await cli.kill()
  }).catch(() => {})

  // ---- Editor de perfis: personalizar sem tirar os comandos fixos do Laaazy ----
  async function openProfile(name) {
    const exe = await getExe()
    if (!exe) return { ok: false, msg: NOT_FOUND }
    const { dir, profiles } = await cli.listProfiles(exe)
    if (!profiles.includes(name)) return { ok: false, msg: profileMissing(name) }
    const text = await cli.readProfile(dir, name)
    const profile = text === null ? null : pad.describeProfile(text, name)
    if (!profile) return { ok: false, msg: `O arquivo do perfil "${name}" está com erro.` }
    return { ok: true, profile, exe, dir, text }
  }

  const profile = async (name) => {
    const o = await openProfile(name)
    return o.ok ? { ok: true, profile: o.profile } : o
  }

  // Grava o botão e, se o perfil é o ativo agora, manda o Laaazy-pad recarregar
  const setButton = (name, id, action) => queue.run(async () => {
    const o = await openProfile(name)
    if (!o.ok) return o
    const r = pad.setButton(o.text, name, id, action)
    if (!r.ok) return r
    const err = await cli.writeProfile(o.dir, name, r.text)
    if (err) return { ok: false, msg: err }
    const active = (await cli.isRunning()) && String(await cli.queryProfile(o.exe)).toLowerCase() === name.toLowerCase()
    const loadErr = active ? await cli.loadProfile(o.exe, name) : ''
    if (loadErr) return { ok: false, msg: 'Salvo, mas o Laaazy-pad não recarregou: ' + loadErr }
    const label = pad.BUTTONS.find((b) => b.id === id).label
    return { ok: true, msg: `${label} salvo no perfil ${name}.`, profile: pad.describeProfile(r.text, name) }
  })

  return { apply, applyFor, applyForGame, get, set, ensureRunning, shutdown, profile, setButton }
}

module.exports = { createDs4 }
