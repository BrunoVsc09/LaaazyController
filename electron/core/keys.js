// Limpa chaves de API coladas: tira espaços, quebras de linha, caracteres invisíveis
// (que vêm junto ao copiar de páginas) e aspas em volta. Chaves nunca têm espaço. Sem I/O.
const INVISIBLE = /[\s​-‍⁠﻿]/g
const QUOTES = /^["'“”‘’]+|["'“”‘’]+$/g

const cleanKey = (raw) => (typeof raw === 'string' ? raw.replace(INVISIBLE, '').replace(QUOTES, '') : '')

// Chave colada no campo errado (ex.: a do Gemini no campo do TMDB): mensagem para o usuário, ou ''
const GEMINI = /^AIza[0-9A-Za-z_-]{30,}$/
const TMDB_TOKEN = /^eyJ[0-9A-Za-z_.-]+$/
const HEX32 = /^[0-9a-f]{32}$/i

// Chaves do Google (AIza...) servem para o Gemini e para o YouTube
const GOOGLE_FIELDS = ['gemini', 'youtube']

function wrongKeyMsg(key, field) {
  const google = GOOGLE_FIELDS.includes(field)
  if (!google && GEMINI.test(key)) return 'Essa é a chave do Gemini (começa com AIza). Cole ela no campo do Gemini; aqui vai outra chave.'
  if (field !== 'tmdb' && TMDB_TOKEN.test(key)) return 'Esse é o token do TMDB (começa com eyJ). Cole ele no campo do TMDB; aqui vai outra chave.'
  if (google && HEX32.test(key)) return 'Essa chave de 32 letras e números é do TMDB ou do SteamGridDB. As do Google (Gemini e YouTube) começam com AIza.'
  return ''
}

module.exports = { cleanKey, wrongKeyMsg }
