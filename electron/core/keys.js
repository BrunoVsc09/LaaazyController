// Limpa chaves de API coladas: tira espaços, quebras de linha, caracteres invisíveis
// (que vêm junto ao copiar de páginas) e aspas em volta. Chaves nunca têm espaço. Sem I/O.
const INVISIBLE = /[\s​-‍⁠﻿]/g
const QUOTES = /^["'“”‘’]+|["'“”‘’]+$/g

const cleanKey = (raw) => (typeof raw === 'string' ? raw.replace(INVISIBLE, '').replace(QUOTES, '') : '')

module.exports = { cleanKey }
