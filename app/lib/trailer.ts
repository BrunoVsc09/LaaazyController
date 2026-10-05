// Prévia do trailer no destaque do Início: endereço do player, conversa com ele
// (API de mensagens do YouTube) e para qual título ir quando o trailer acaba.
export const PREVIEW_DELAY_MS = 1200 // parado no título por esse tempo antes de tocar
export const YT_ORIGIN = 'https://www.youtube-nocookie.com'

const KEY = /^[\w-]{6,20}$/

// Sem controles; enablejsapi para ligar o som e saber quando acaba (sem loop: acaba e passa)
// captions: trailer que não é em português → liga a legenda em português (se o vídeo tiver)
export function trailerEmbedUrl(key: string | null | undefined, { sound = false, captions = false } = {}) {
  if (!key || !KEY.test(key)) return null
  const q = new URLSearchParams({
    autoplay: '1', mute: sound ? '0' : '1', controls: '0', enablejsapi: '1',
    playsinline: '1', rel: '0', modestbranding: '1', disablekb: '1',
  })
  if (captions) { q.set('cc_load_policy', '1'); q.set('cc_lang_pref', 'pt'); q.set('hl', 'pt-BR') }
  return `${YT_ORIGIN}/embed/${key}?${q}`
}

// Mensagem do player → 'ended' quando o vídeo acabou (estado 0); 'error' quando o vídeo não
// pode tocar (removido, privado, bloqueado fora do YouTube); o resto não interessa
export function playerEvent(origin: string, data: unknown): 'ended' | 'error' | null {
  if (origin !== YT_ORIGIN) return null
  let msg: { event?: string; info?: unknown } | null = null
  try { msg = typeof data === 'string' ? JSON.parse(data) : (data as typeof msg) } catch { return null }
  if (!msg || typeof msg !== 'object') return null
  if (msg.event === 'onError') return 'error'
  if (msg.event === 'onStateChange' && msg.info === 0) return 'ended'
  const info = msg.info as { playerState?: number } | undefined
  if (msg.event === 'infoDelivery' && info && info.playerState === 0) return 'ended'
  return null
}

// 'listening' faz o player começar a mandar eventos; o resto são comandos (mute, unMute...)
export function playerCommand(func: string) {
  return JSON.stringify(func === 'listening' ? { event: 'listening', id: 1, channel: 'widget' } : { event: 'command', func, args: [] })
}

// Próximo título: o seguinte da mesma fileira, depois a fileira seguinte, depois o começo
export function nextTitleId(rows: { items: { id: string }[] }[], currentId: string | null) {
  const all = rows.flatMap((r) => r.items.map((t) => t.id))
  if (!all.length) return null
  const i = currentId ? all.indexOf(currentId) : -1
  return i < 0 ? all[0] : all[(i + 1) % all.length]
}

// Filmes e séries primeiro (logo abaixo do destaque); jogos e apps depois
export const homeSections = () => ['hero', 'titles', 'recent', 'apps'] as const
