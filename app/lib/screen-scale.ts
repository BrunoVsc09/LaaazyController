// Tamanho do Laaazy: a tela inteira cresce junto (zoom da página), para ler de longe. As janelas que
// já ocupam a tela toda (Novidades, teclado na tela, proteção de tela) ficam como são (CSS).
import screenScale from '../../shared/screen-scale'

const SCALES: { value: number; label: string }[] = screenScale.SCREEN_SCALES
const valid = (v: number) => SCALES.some((s) => s.value === v)

export const nextScreenScale = (v: number) => SCALES[(SCALES.findIndex((s) => s.value === v) + 1) % SCALES.length].value
export function screenScaleLabel(v: number) {
  const s = SCALES.find((x) => x.value === v) ?? SCALES[0]
  return s.value === 100 ? s.label : `${s.label} (${s.value}%)`
}
export const screenScaleMsg = (v: number) => (v === 100
  ? 'O Laaazy no tamanho normal.'
  : `O Laaazy inteiro em ${v}%: letras, botões e capas maiores, para ler de longe.`)

// Valor do zoom da página ('1' = como hoje)
export const zoomFor = (v: number) => String(valid(v) ? v / 100 : 1)

// Marca no <html> (data-lz-scale): em Maior e Cama o Início se reorganiza (screen-scale.css)
export const scaleAttr = (v: number) => String(valid(v) ? v : 100)

// Miniatura do Início na telinha de exemplo: medidas em % da altura, as do Início de hoje em
// 1920x1080 (topo de 96 px, título do destaque de 46 px, texto de ~17 px) vezes o tamanho escolhido.
// Em Maior e Cama os cards do Início ficam com 18% da largura da tela: cabem 5
const BASE = { header: 96, title: 46, text: 17 }
const pct = (px: number, s: number) => (px / 1080) * 100 * s
export function homePreview(v: number) {
  const s = (valid(v) ? v : 100) / 100
  const cards = s >= 1.5 ? 5 : Math.max(2, Math.round(6 / s))
  return { header: pct(BASE.header, s), title: pct(BASE.title, s), text: pct(BASE.text, s), cards }
}
