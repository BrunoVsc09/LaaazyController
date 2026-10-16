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

export const youtubeTvMsg = (on: boolean) => (on
  ? 'O YouTube abre com a tela de TV (setas, OK e Voltar). Na 1ª vez, entre pelo celular com o código que aparece. Vale da próxima vez que o Edge abrir.'
  : 'O YouTube abre o site comum. Vale da próxima vez que o Edge abrir.')

export const subtitleMsg = (id: string) => (id === 'site'
  ? 'A legenda fica no tamanho de cada site. Vale da próxima vez que o Edge abrir.'
  : `Legenda ${subtitleLabel(id)} nos serviços do Edge. Vale da próxima vez que o Edge abrir (feche o serviço e abra de novo).`)

// Janelinha "Aa" do topo (ao lado do controle): as duas opções com o valor de agora
export type SizeKey = 'siteScale' | 'subtitleSize'
export function sizeMenuItems(s: { siteScale?: number; subtitleSize?: string }): { key: SizeKey; label: string }[] {
  return [
    { key: 'siteScale', label: `Tamanho dos sites: ${siteScaleLabel(s.siteScale ?? tvStyle.DEFAULT_SITE_SCALE)}` },
    { key: 'subtitleSize', label: `Legenda: ${subtitleLabel(s.subtitleSize ?? tvStyle.DEFAULT_SUBTITLE_SIZE)}` },
  ]
}

// Telinha de exemplo (16:9) na janelinha "Aa": medidas em % da altura dela, na mesma proporção da
// tela de verdade. Legenda = o vh escolhido ("Do site" ≈ 4%); título de site ≈ 1,8% da altura em 100%
// e cresce com a escala; cabem menos títulos por fileira quanto maior o site
const SITE_SUBTITLE = 4
const SITE_TITLE = 1.8
export function sizePreview(s: { siteScale?: number; subtitleSize?: string }) {
  const scale = (s.siteScale ?? tvStyle.DEFAULT_SITE_SCALE) / 100
  const vh = tvStyle.SUBTITLE_SIZES.find((x: { id: string }) => x.id === (s.subtitleSize ?? tvStyle.DEFAULT_SUBTITLE_SIZE))?.vh || SITE_SUBTITLE
  return { subtitle: vh, title: SITE_TITLE * scale, cards: Math.max(2, Math.round(6 / scale)) }
}
