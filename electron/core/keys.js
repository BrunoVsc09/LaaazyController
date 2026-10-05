// Limpa chaves de API coladas: tira espaços, quebras de linha, caracteres invisíveis
// (que vêm junto ao copiar de páginas) e aspas em volta. Chaves nunca têm espaço. Sem I/O.
const INVISIBLE = /[\s​-‍⁠﻿]/g
const QUOTES = /^["'“”‘’]+|["'“”‘’]+$/g

const cleanKey = (raw) => (typeof raw === 'string' ? raw.replace(INVISIBLE, '').replace(QUOTES, '') : '')

// Chave colada no campo errado (ex.: a do Gemini no campo do TMDB): mensagem para o usuário, ou ''
const GEMINI = /^AIza[0-9A-Za-z_-]{30,}$/
const TMDB_TOKEN = /^eyJ[0-9A-Za-z_.-]+$/
const HEX32 = /^[0-9a-f]{32}$/i

function wrongKeyMsg(key, field) {
  if (field !== 'gemini' && GEMINI.test(key)) return 'Essa é a chave do Gemini (começa com AIza). Cole ela no campo do Gemini; aqui vai outra chave.'
  if (field !== 'tmdb' && TMDB_TOKEN.test(key)) return 'Esse é o token do TMDB (começa com eyJ). Cole ele no campo do TMDB; aqui vai outra chave.'
  if (field === 'gemini' && HEX32.test(key)) return 'Essa chave de 32 letras e números é do TMDB ou do SteamGridDB. A do Gemini começa com AIza.'
  return ''
}

module.exports = { cleanKey, wrongKeyMsg }
