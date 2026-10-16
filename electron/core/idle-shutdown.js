// Desligar o PC sem uso (pedido do Bruno, 2026-10-15). Sem I/O.
// "Sem uso" = nem teclado/mouse (tempo ocioso do Windows) nem controle (Query.1.IdleSeconds do
// Laaazy-pad): o Windows não enxerga o DS4, e desligaria no meio de um jogo só com o controle.
// Passou do tempo → aviso de 60 s; qualquer uso cancela; senão desliga (sem forçar: o Windows
// pergunta se algum programa tiver coisa sem salvar).

const IDLE_HOURS = [0, 2, 3, 4, 6] // 0 = nunca (padrão)
const WARNING_SECONDS = 60

const idleSeconds = (systemIdle, padIdle) => (padIdle === null || padIdle === undefined ? systemIdle : Math.min(systemIdle, padIdle))

// warning = { idleAtStart } durante o aviso; se o tempo parado diminuir, alguém mexeu
function decide({ hours, idle, warning }) {
  if (!hours) return { action: warning ? 'cancel' : 'none', warning: null }
  if (warning) {
    if (idle < warning.idleAtStart) return { action: 'cancel', warning: null }
    const seconds = WARNING_SECONDS - (idle - warning.idleAtStart)
    return seconds <= 0 ? { action: 'shutdown', warning: null } : { action: 'countdown', seconds, warning }
  }
  if (idle >= hours * 3600) return { action: 'warn', seconds: WARNING_SECONDS, warning: { idleAtStart: idle } }
  return { action: 'none', warning: null }
}

// Suspenso, o Laaazy congela e não desliga: com a opção ligada, o Windows não suspende antes
const blocksSuspend = (hours) => hours > 0

module.exports = { idleSeconds, decide, blocksSuspend, IDLE_HOURS, WARNING_SECONDS }
