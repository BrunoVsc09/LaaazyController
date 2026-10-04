// O player embutido do YouTube exige saber de qual app vem o pedido (sem isso: erro 153).
// Para apps de desktop, a orientação é se identificar como https://<id-do-app>. Sem I/O.
const REFERER = 'https://com.bruno.laaazy/'
const EMBED_URLS = ['https://www.youtube-nocookie.com/embed/*', 'https://www.youtube.com/embed/*']
const EMBED = /^https:\/\/www\.(youtube-nocookie|youtube)\.com\/embed\//

function refererFor(url) {
  try { return EMBED.test(new URL(url).href) ? REFERER : null } catch { return null }
}

module.exports = { REFERER, EMBED_URLS, refererFor }
