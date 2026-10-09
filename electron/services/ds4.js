// Troca o perfil do controle (Laaazy-pad) por card e por jogo, abre e fecha o Laaazy-pad.
// Tudo passa por uma fila: duas trocas nunca rodam ao mesmo tempo.
// (O nome "ds4" ficou do tempo do DS4Windows; renomear é outra refatoração.)
const { createQueue } = require('../core/queue')
const { mergeConfig, validateChange, gameProfileFor, profileMissing } = require('../core/ds4-config')

const NOT_FOUND = 'Não achei o Laaazy-pad. Escolha a pasta dele em Configurações.'
const HINT = 'Se nada mudou, veja se o controle está conectado e se o Laaazy-pad está aberto.'

// readyDelayMs: quanto esperar depois de abrir até o programa aceitar comandos
function createDs4({ cli, getExe, readCfg, writeCfg, sleep, readyDelayMs = 300, openPath = async () => '' }) {
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
    return { profiles, dir, config: await config(), cmd: cli.cmdName(exe) }
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

  // Pasta dos perfis (*.json) do Laaazy-pad, para editar ou conferir
  async function openDir() {
    const exe = await getExe()
    if (!exe) return { ok: false, msg: NOT_FOUND }
    const { dir } = await cli.listProfiles(exe)
    if (!dir) return { ok: false, msg: 'Não achei a pasta dos perfis do Laaazy-pad.' }
    const err = await openPath(dir)
    return err ? { ok: false, msg: 'Não consegui abrir a pasta: ' + err } : { ok: true, msg: 'Pasta dos perfis aberta: ' + dir }
  }

  return { apply, applyFor, applyForGame, get, set, ensureRunning, shutdown, openDir }
}

module.exports = { createDs4 }
