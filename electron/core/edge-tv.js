// O Laaazy fala com o Edge do perfil dele pelo canal privado (--remote-debugging-pipe): só o Laaazy
// enxerga (sem porta aberta). Em cada janela nova, aplica a "cara" de TV no YouTube e a legenda
// grande. Troca a extensão, que o Edge 155 desativava depois da 1ª abertura de cada perfil. Sem I/O.
const { subtitleCss, TV_USER_AGENT } = require('./tv-style')

const SEP = '\0'
const frame = (msg) => JSON.stringify(msg) + SEP

// Mensagens completas do que chegou + o pedaço que ainda não terminou. Quebrada = ignorada.
function splitFrames(buffer) {
  const parts = String(buffer).split(SEP)
  const rest = parts.pop()
  const messages = []
  for (const p of parts) {
    try { messages.push(JSON.parse(p)) } catch {}
  }
  return { messages, rest }
}

const isYouTube = (url) => {
  try { return /(^|\.)youtube\.com$/.test(new URL(url).hostname) } catch { return false }
}

// Põe a folha de estilo na página. No começo da navegação o "document" ainda é o da página anterior
// (o Edge troca o documento e mantém a janela; conferido no Edge 155): por isso espera pela janela o
// documento novo ficar pronto, e põe de volta sempre que a página tirar o estilo.
const styleScript = (css) => `(() => {
  const css = ${JSON.stringify(css)}
  const put = () => {
    const doc = window.document
    const root = doc.head || doc.documentElement
    if (!root || doc.getElementById('laaazy-tv')) return
    const s = doc.createElement('style')
    s.id = 'laaazy-tv'
    s.textContent = css
    root.appendChild(s)
  }
  const watch = () => { put(); new MutationObserver(put).observe(window.document, { childList: true, subtree: true }) }
  put()
  if (window.document.readyState === 'loading') window.addEventListener('DOMContentLoaded', watch, { once: true })
  else watch()
})()`

// Comandos para uma janela nova (antes de ela carregar); [] = nada a fazer
function pageSetup({ url, subtitleSize, youtubeTv }) {
  const cmds = []
  if (youtubeTv && isYouTube(url)) {
    cmds.push({
      method: 'Network.setUserAgentOverride',
      params: {
        userAgent: TV_USER_AGENT,
        // sem as client hints do Windows: senão o YouTube manda para o site comum
        userAgentMetadata: { brands: [], fullVersionList: [], platform: '', platformVersion: '', architecture: '', model: '', mobile: false },
      },
    })
  }
  const css = subtitleCss(subtitleSize)
  if (css) {
    // Sem o Page.enable antes, o Edge aceita o script e não roda (conferido no Edge 155)
    cmds.push({ method: 'Page.enable', params: {} })
    cmds.push({ method: 'Page.addScriptToEvaluateOnNewDocument', params: { source: styleScript(css), runImmediately: true } })
  }
  return cmds
}

// A janela já começou a carregar antes de o Laaazy se ligar a ela: recarrega uma vez com as regras
const needsReload = (url) => /^https?:\/\//.test(String(url || ''))

module.exports = { frame, splitFrames, pageSetup, needsReload }
