// Tempo real do teclado por cima: o texto mudou de prev para next → apagar N e digitar o resto.
// Usado pela tela (calcula a mudança) e pelo Electron (testes em electron/core/typing).
function editDiff(prev, next) {
  let p = 0
  while (p < prev.length && p < next.length && prev[p] === next[p]) p++
  return { back: prev.length - p, text: next.slice(p) }
}

module.exports = { editDiff }
