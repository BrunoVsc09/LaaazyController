import { describe, it, expect } from 'vitest'
import { trailerEmbedUrl, homeSections, playerEvent, playerCommand, nextTitleId, YT_ORIGIN, titlePress, titleFocus } from './trailer'

describe('trailerEmbedUrl', () => {
  it('player do YouTube sem controles, aceitando comandos e avisando quando acaba (sem repetir)', () => {
    const u = new URL(trailerEmbedUrl('dQw4w9WgXcQ')!)
    expect(u.origin + u.pathname).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')
    expect(Object.fromEntries(u.searchParams)).toMatchObject({ autoplay: '1', mute: '1', controls: '0', enablejsapi: '1', playsinline: '1' })
    expect(u.searchParams.get('loop')).toBeNull()
  })
  it('com som: começa sem mudo', () => {
    expect(new URL(trailerEmbedUrl('dQw4w9WgXcQ', { sound: true })!).searchParams.get('mute')).toBe('0')
  })
  it('trailer que não é em português: legenda em português ligada (quando o vídeo tiver)', () => {
    const q = new URL(trailerEmbedUrl('dQw4w9WgXcQ', { captions: true })!).searchParams
    expect(Object.fromEntries(q)).toMatchObject({ cc_load_policy: '1', cc_lang_pref: 'pt', hl: 'pt-BR' })
    expect(new URL(trailerEmbedUrl('dQw4w9WgXcQ')!).searchParams.get('cc_load_policy')).toBeNull()
  })
  it('chave estranha não vira URL', () => {
    expect(trailerEmbedUrl('../../x')).toBeNull()
    expect(trailerEmbedUrl('')).toBeNull()
    expect(trailerEmbedUrl(null)).toBeNull()
  })
})

describe('conversa com o player do YouTube', () => {
  it('reconhece o fim do vídeo (dos dois jeitos que o player avisa)', () => {
    expect(playerEvent(YT_ORIGIN, JSON.stringify({ event: 'onStateChange', info: 0 }))).toBe('ended')
    expect(playerEvent(YT_ORIGIN, JSON.stringify({ event: 'infoDelivery', info: { playerState: 0 } }))).toBe('ended')
    expect(playerEvent(YT_ORIGIN, JSON.stringify({ event: 'onStateChange', info: 1 }))).toBeNull()
  })
  it('vídeo que não pode tocar (removido, bloqueado fora do YouTube): erro, para tentar o próximo', () => {
    for (const code of [2, 5, 100, 101, 150]) expect(playerEvent(YT_ORIGIN, JSON.stringify({ event: 'onError', info: code }))).toBe('error')
  })
  it('ignora mensagens de outras origens e lixo', () => {
    expect(playerEvent('https://evil.com', JSON.stringify({ event: 'onStateChange', info: 0 }))).toBeNull()
    expect(playerEvent(YT_ORIGIN, '{quebrado')).toBeNull()
    expect(playerEvent(YT_ORIGIN, { event: 'onStateChange', info: 0 })).toBe('ended')
  })
  it('comandos para ligar/desligar o som e para escutar os eventos', () => {
    expect(JSON.parse(playerCommand('unMute'))).toEqual({ event: 'command', func: 'unMute', args: [] })
    expect(JSON.parse(playerCommand('listening'))).toEqual({ event: 'listening', id: 1, channel: 'widget' })
  })
})

describe('nextTitleId (passar para o próximo quando o trailer acaba)', () => {
  const rows = [{ items: [{ id: 'a' }, { id: 'b' }] }, { items: [{ id: 'c' }] }]
  it('próximo da mesma fileira; no fim, o primeiro da fileira seguinte; no fim de tudo, o primeiro', () => {
    expect(nextTitleId(rows, 'a')).toBe('b')
    expect(nextTitleId(rows, 'b')).toBe('c')
    expect(nextTitleId(rows, 'c')).toBe('a')
  })
  it('título que não está nas fileiras: o primeiro; sem títulos: null', () => {
    expect(nextTitleId(rows, 'x')).toBe('a')
    expect(nextTitleId([], 'x')).toBeNull()
  })
})

describe('homeSections (ordem do Início)', () => {
  it('filmes e séries logo abaixo do destaque; jogos e apps depois', () => {
    expect(homeSections()).toEqual(['hero', 'titles', 'recent', 'apps'])
  })
})

describe('titlePress: o trailer só toca quando você aperta', () => {
  it('1º aperto num título: mostra a prévia', () => {
    expect(titlePress(null, 'tv:1', true)).toBe('preview')
  })
  it('2º aperto no mesmo título (prévia já dele): abre onde assistir', () => {
    expect(titlePress('tv:1', 'tv:1', true)).toBe('open')
  })
  it('aperto em outro título enquanto a prévia de um toca: troca a prévia', () => {
    expect(titlePress('tv:1', 'movie:2', true)).toBe('preview')
  })
  it('prévia desligada em Configurações: o aperto já abre onde assistir', () => {
    expect(titlePress(null, 'tv:1', false)).toBe('open')
  })
})

describe('titleFocus: passar por cima (mouse, analógico, D-pad) não cancela a prévia', () => {
  it('sem prévia tocando: o destaque mostra o título em foco', () => {
    expect(titleFocus(null, 'tv:2')).toBe('show')
  })
  it('com a prévia de outro título tocando: o destaque fica nele (só um aperto troca)', () => {
    expect(titleFocus('tv:1', 'tv:2')).toBe('keep')
  })
  it('voltar ao título que está tocando: segue mostrando ele', () => {
    expect(titleFocus('tv:1', 'tv:1')).toBe('show')
  })
})
