// Serviços do Edge com cara de TV: o CSS da legenda grande, a "cara" de TV do YouTube e a escala dos
// sites. Sem I/O. Quem aplica é o services/edge-tv, pelo canal privado com o Edge.
// Os nomes das classes vêm de cada site e podem mudar sem aviso (o mesmo CSS do
// docs/tampermonkey/laaazy-tv.user.js, o plano B).
const { SUBTITLE_SIZES, SITE_SCALES } = require('../../shared/tv-style')

const OUTLINE = '0 0 3px #000, 0 0 6px #000, 2px 2px 4px #000' // borda escura: lê em cena clara
// O youtube.com/tv só mostra a tela de TV para uma TV (conferido no Edge 155 com uma TV Samsung)
const TV_USER_AGENT = 'Mozilla/5.0 (SMART-TV; LINUX; Tizen 6.0) AppleWebKit/537.36 (KHTML, like Gecko) 85.0.4183.93/6.0 TV Safari/537.36'

// CSS da legenda no tamanho escolhido; '' = "Do site" (não mexe)
function subtitleCss(sizeId) {
  const size = SUBTITLE_SIZES.find((s) => s.id === sizeId)
  if (!size || !size.vh) return ''
  const font = `font-size: ${size.vh}vh !important`
  const shadow = `text-shadow: ${OUTLINE} !important`
  return [
    '/* Laaazy: legenda grande para ver de longe (Configurações → Streaming → Tamanho da legenda) */',
    `.player-timedtext-text-container span { ${font}; line-height: 1.25 !important; ${shadow}; } /* Netflix */`,
    `.atvwebplayersdk-captions-text { ${font}; line-height: 1.25 !important; ${shadow}; } /* Prime Video */`,
    `.ytp-caption-segment { ${font}; ${shadow}; } /* YouTube */`,
    `[data-testid="CueBoxContainer"] span, [class*="TextCue"] span { ${font}; ${shadow}; } /* HBO Max */`,
    `video::cue { ${font}; ${shadow}; } /* legenda do próprio navegador (WebVTT) */`,
    '',
  ].join('\n')
}

// Sites maiores: o Edge abre como se a tela fosse maior (títulos, capas e menus crescem juntos e o
// site se arruma para a "tela menor"). A legenda continua do tamanho escolhido (vh). 100 = nada.
const siteScaleArgs = (scale) => (SITE_SCALES.includes(scale) && scale !== 100 ? ['--force-device-scale-factor=' + scale / 100] : [])

module.exports = { subtitleCss, siteScaleArgs, TV_USER_AGENT }
