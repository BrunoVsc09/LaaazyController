// Prévia do trailer no destaque do Início e a ordem das seções.
export const PREVIEW_DELAY_MS = 1200 // parado no título por esse tempo antes de tocar

const KEY = /^[\w-]{6,20}$/

// Player do YouTube sem som, sem controles e em loop (só para olhar; o som fica no botão Trailer)
export function trailerEmbedUrl(key: string | null | undefined) {
  if (!key || !KEY.test(key)) return null
  const q = new URLSearchParams({ autoplay: '1', mute: '1', controls: '0', loop: '1', playlist: key, playsinline: '1', rel: '0', modestbranding: '1', disablekb: '1' })
  return `https://www.youtube-nocookie.com/embed/${key}?${q}`
}

// Filmes e séries primeiro (logo abaixo do destaque); jogos e apps depois
export const homeSections = () => ['hero', 'titles', 'recent', 'apps'] as const
