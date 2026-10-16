// Legenda grande nos serviços abertos no Edge: os arquivos de uma extensão do Laaazy só de CSS
// (Manifest V3, sem permissão nenhuma), que o Edge carrega com --load-extension. Sem I/O.
// Os nomes das classes vêm de cada site e podem mudar sem aviso (o mesmo CSS do
// docs/tampermonkey/laaazy-tv.user.js, o plano B se um Edge futuro tirar o --load-extension).
const { SUBTITLE_SIZES, SITE_SCALES } = require('../../shared/tv-style')

const MATCHES = [
  'https://www.netflix.com/*', 'https://www.primevideo.com/*', 'https://*.hbomax.com/*', 'https://play.max.com/*',
  'https://www.crunchyroll.com/*', 'https://www.youtube.com/*',
]
const OUTLINE = '0 0 3px #000, 0 0 6px #000, 2px 2px 4px #000' // borda escura: lê em cena clara

function css(vh) {
  const size = `font-size: ${vh}vh !important`
  const shadow = `text-shadow: ${OUTLINE} !important`
  return [
    '/* Laaazy: legenda grande para ver de longe (Configurações → Streaming → Tamanho da legenda) */',
    `.player-timedtext-text-container span { ${size}; line-height: 1.25 !important; ${shadow}; } /* Netflix */`,
    `.atvwebplayersdk-captions-text { ${size}; line-height: 1.25 !important; ${shadow}; } /* Prime Video */`,
    `.ytp-caption-segment { ${size}; ${shadow}; } /* YouTube */`,
    `[data-testid="CueBoxContainer"] span, [class*="TextCue"] span { ${size}; ${shadow}; } /* HBO Max */`,
    `video::cue { ${size}; ${shadow}; } /* legenda do próprio navegador (WebVTT) */`,
    '',
  ].join('\n')
}

// { 'manifest.json', 'tv.css' } para o tamanho escolhido; null = "Do site" (não mexe em nada)
function extensionFiles(sizeId) {
  const size = SUBTITLE_SIZES.find((s) => s.id === sizeId)
  if (!size || !size.vh) return null
  const manifest = {
    manifest_version: 3,
    name: 'Laaazy TV',
    version: '1.0.0',
    description: 'Legenda grande nos serviços do Laaazy, para ver de longe. Só CSS.',
    content_scripts: [{ matches: MATCHES, css: ['tv.css'], run_at: 'document_start' }],
  }
  return { 'manifest.json': JSON.stringify(manifest, null, 2) + '\n', 'tv.css': css(size.vh) }
}

// Sites maiores: o Edge abre como se a tela fosse maior (títulos, capas e menus crescem juntos e o
// site se arruma para a "tela menor"). A legenda continua do tamanho escolhido (vh). 100 = nada.
const siteScaleArgs = (scale) => (SITE_SCALES.includes(scale) && scale !== 100 ? ['--force-device-scale-factor=' + scale / 100] : [])

module.exports = { extensionFiles, siteScaleArgs, MATCHES }
