// Streaming: tamanho da legenda nos serviços abertos no Edge (extensão do Laaazy só de CSS).
import tvStyle from '../../shared/tv-style'

const SIZES: { id: string; label: string }[] = tvStyle.SUBTITLE_SIZES

export function nextSubtitleSize(id: string) {
  const i = SIZES.findIndex((s) => s.id === id)
  return SIZES[(i + 1) % SIZES.length].id
}
export const subtitleLabel = (id: string) => SIZES.find((s) => s.id === id)?.label ?? 'Do site'
const SCALES: number[] = tvStyle.SITE_SCALES
export const nextSiteScale = (s: number) => SCALES[(SCALES.indexOf(s) + 1) % SCALES.length]
export const siteScaleLabel = (s: number) => (s === 100 ? 'Do site' : `${s}%`)
export const siteScaleMsg = (s: number) => (s === 100
  ? 'Sites do Edge no tamanho normal. Vale da próxima vez que o Edge abrir.'
  : `Sites do Edge em ${s}%: títulos e menus maiores. Vale da próxima vez que o Edge abrir (feche o serviço e abra de novo).`)

export const subtitleMsg = (id: string) => (id === 'site'
  ? 'A legenda fica no tamanho de cada site. Vale da próxima vez que o Edge abrir.'
  : `Legenda ${subtitleLabel(id)} nos serviços do Edge. Vale da próxima vez que o Edge abrir (feche o serviço e abra de novo).`)
