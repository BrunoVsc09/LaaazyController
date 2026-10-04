// electron-builder afterPack: assina o app com VMP (castlabs EVS) depois de empacotar.
// Sem isso, o electron-builder altera o electron.exe e a assinatura que veio com a
// castlabs deixa de valer: Netflix e outros serviços com DRM recusam tocar.
//
// Preparação (uma vez, na máquina que gera o build):
//   pip install --upgrade castlabs-evs
//   python -m castlabs_evs.account signup     (conta gratuita; você faz o login)
//
// Se o EVS não estiver instalado, o build continua e avisa. Para falhar o build
// nesse caso, defina LAZY_VMP_REQUIRED=1.
const { execFileSync } = require('child_process')

exports.default = async function vmpSign(context) {
  try {
    execFileSync('python', ['-m', 'castlabs_evs.vmp', 'sign-pkg', context.appOutDir], { stdio: 'inherit' })
    console.log('[vmp] app assinado com VMP.')
  } catch (e) {
    console.warn('[vmp] NÃO assinado com VMP: vídeos com DRM podem não tocar no .exe. Veja scripts/vmp-sign.js.')
    if (process.env.LAZY_VMP_REQUIRED) throw e
  }
}
