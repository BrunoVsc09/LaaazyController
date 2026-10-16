// Serviços do Edge com cara de TV: os arquivos de uma extensão do Laaazy, que o Edge carrega com
// --load-extension. Sem I/O.
// - Legenda grande: só CSS, sem permissão nenhuma. Os nomes das classes vêm de cada site e podem
//   mudar sem aviso (o mesmo CSS do docs/tampermonkey/laaazy-tv.user.js, o plano B).
// - YouTube com tela de TV: o youtube.com/tv só abre a tela de TV para uma TV. O Edge ignora
//   --user-agent, então a extensão troca o cabeçalho (sem as client hints do Windows) e o navigator,
//   só em youtube.com (conferido no Edge 155).
const { SUBTITLE_SIZES, SITE_SCALES } = require('../../shared/tv-style')

const MATCHES = [
  'https://www.netflix.com/*', 'https://www.primevideo.com/*', 'https://*.hbomax.com/*', 'https://play.max.com/*',
  'https://www.crunchyroll.com/*', 'https://www.youtube.com/*',
]
const OUTLINE = '0 0 3px #000, 0 0 6px #000, 2px 2px 4px #000' // borda escura: lê em cena clara
const TV_USER_AGENT = 'Mozilla/5.0 (SMART-TV; LINUX; Tizen 6.0) AppleWebKit/537.36 (KHTML, like Gecko) 85.0.4183.93/6.0 TV Safari/537.36'
const CLIENT_HINTS = [
  'sec-ch-ua', 'sec-ch-ua-mobile', 'sec-ch-ua-platform', 'sec-ch-ua-platform-version', 'sec-ch-ua-full-version',
  'sec-ch-ua-full-version-list', 'sec-ch-ua-model', 'sec-ch-ua-arch', 'sec-ch-ua-bitness', 'sec-ch-ua-wow64',
]
const RESOURCE_TYPES = ['main_frame', 'sub_frame', 'xmlhttprequest', 'script', 'stylesheet', 'image', 'media', 'font', 'websocket', 'ping', 'other']

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

// Regra do declarativeNetRequest: cabeçalho de TV só para youtube.com
const youtubeRules = () => [{
  id: 1,
  priority: 1,
  action: {
    type: 'modifyHeaders',
    requestHeaders: [
      { header: 'User-Agent', operation: 'set', value: TV_USER_AGENT },
      ...CLIENT_HINTS.map((header) => ({ header, operation: 'remove' })),
    ],
  },
  condition: { requestDomains: ['youtube.com'], resourceTypes: RESOURCE_TYPES },
}]

// Roda na página do YouTube antes do site: o navigator também diz "TV"
const youtubeScript = () => `// Laaazy: YouTube com tela de TV (Configurações → Streaming)
(() => {
  const UA = ${JSON.stringify(TV_USER_AGENT)}
  const define = (key, value) => { try { Object.defineProperty(Navigator.prototype, key, { get: () => value, configurable: true }) } catch {} }
  define('userAgent', UA)
  define('appVersion', UA.slice('Mozilla/'.length))
  define('platform', 'Linux armv7l')
  define('userAgentData', undefined)
  // O Edge abre a 1ª página antes de a regra do cabeçalho ficar pronta, e o YouTube manda para o site
  // comum (?app=desktop&sbb=1): volta para o /tv (no máximo 2 vezes por janela, para nunca dar loop)
  const q = location.search
  if (q.includes('app=desktop') && q.includes('sbb=1')) {
    const tries = Number(sessionStorage.getItem('laaazy-tv') || 0)
    if (tries < 2) { sessionStorage.setItem('laaazy-tv', String(tries + 1)); location.replace('https://www.youtube.com/tv') }
  }
})()
`

// { nome: texto } da extensão; null = nada a fazer ("Do site" e sem YouTube de TV)
function extensionFiles(sizeId, { youtubeTv = false } = {}) {
  const size = SUBTITLE_SIZES.find((s) => s.id === sizeId)
  const subtitles = !!(size && size.vh)
  if (!subtitles && !youtubeTv) return null
  const manifest = {
    manifest_version: 3,
    name: 'Laaazy TV',
    version: '1.0.0',
    description: 'Serviços do Laaazy com cara de TV: legenda grande e o YouTube com a tela de TV.',
    content_scripts: [
      ...(subtitles ? [{ matches: MATCHES, css: ['tv.css'], run_at: 'document_start' }] : []),
      ...(youtubeTv ? [{ matches: ['https://www.youtube.com/*'], js: ['youtube-tv.js'], run_at: 'document_start', world: 'MAIN' }] : []),
    ],
    ...(youtubeTv ? {
      permissions: ['declarativeNetRequest'],
      host_permissions: ['https://*.youtube.com/*'],
      declarative_net_request: { rule_resources: [{ id: 'youtube_tv', enabled: true, path: 'youtube-tv.json' }] },
    } : {}),
  }
  return {
    'manifest.json': JSON.stringify(manifest, null, 2) + '\n',
    ...(subtitles ? { 'tv.css': css(size.vh) } : {}),
    ...(youtubeTv ? { 'youtube-tv.json': JSON.stringify(youtubeRules(), null, 2) + '\n', 'youtube-tv.js': youtubeScript() } : {}),
  }
}

// Sites maiores: o Edge abre como se a tela fosse maior (títulos, capas e menus crescem juntos e o
// site se arruma para a "tela menor"). A legenda continua do tamanho escolhido (vh). 100 = nada.
const siteScaleArgs = (scale) => (SITE_SCALES.includes(scale) && scale !== 100 ? ['--force-device-scale-factor=' + scale / 100] : [])

module.exports = { extensionFiles, siteScaleArgs, MATCHES, TV_USER_AGENT }
