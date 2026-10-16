// ==UserScript==
// @name         Laaazy TV: legendas grandes
// @namespace    laaazy
// @version      1.0.0
// @description  Só visual: legenda maior e com contorno nos serviços do Laaazy, para ler do sofá. Não clica, não lê e não manda nada.
// @match        https://www.netflix.com/*
// @match        https://www.primevideo.com/*
// @match        https://*.hbomax.com/*
// @match        https://play.max.com/*
// @match        https://www.crunchyroll.com/*
// @match        https://www.youtube.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

// Só CSS. Tamanho em vh (porcentagem da altura da tela): 5vh ≈ 54 px numa TV 1080p.
// Mude aqui e salve (no Tampermonkey: Painel → Laaazy TV → editar).
const LEGENDA = '5vh'
const CONTORNO = '0 0 3px #000, 0 0 6px #000, 2px 2px 4px #000' // borda escura: lê em cena clara

// Os nomes vêm de cada site e podem mudar sem aviso: se a legenda de um serviço voltar a ficar
// pequena, é a linha dele que precisa ser atualizada.
const CSS = `
/* Netflix */
.player-timedtext-text-container span { font-size: ${LEGENDA} !important; line-height: 1.25 !important; text-shadow: ${CONTORNO} !important; }
/* Prime Video */
.atvwebplayersdk-captions-text { font-size: ${LEGENDA} !important; line-height: 1.25 !important; text-shadow: ${CONTORNO} !important; }
/* YouTube */
.ytp-caption-segment { font-size: ${LEGENDA} !important; text-shadow: ${CONTORNO} !important; }
/* HBO Max e quem usa legenda do próprio navegador (WebVTT) */
[data-testid="CueBoxContainer"] span, [class*="TextCue"] span { font-size: ${LEGENDA} !important; text-shadow: ${CONTORNO} !important; }
video::cue { font-size: ${LEGENDA}; text-shadow: ${CONTORNO}; }
`

const style = document.createElement('style')
style.id = 'laaazy-tv'
style.textContent = CSS
;(document.head || document.documentElement).appendChild(style)
