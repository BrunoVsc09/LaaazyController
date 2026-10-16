import { describe, it, expect } from 'vitest'
import mod from './equalizer.js'
import { PRESETS } from '../../shared/equalizer.js'

const flat = () => ({ on: true, preset: 'geral', bands: Array(10).fill(0), bass: 0, clarity: 0, volume: 0 })
const withBands = (pairs) => {
  const s = flat()
  for (const [i, db] of pairs) s.bands[i] = db
  return s
}
// Só as linhas que o Equalizer APO lê (sem o comentário do topo)
const lines = (state) => mod.render(state).split('\n').filter((l) => l && !l.startsWith('#'))

describe('equalizador: texto do Equalizer APO', () => {
  it('tudo no zero: só o preamp neutro, nenhum filtro', () => {
    expect(lines(flat())).toEqual(['Preamp: 0.0 dB'])
  })
  it('começa com um comentário avisando que o arquivo é do Laaazy', () => {
    expect(mod.render(flat())).toMatch(/^# .*Laaazy/)
  })
  it('banda mexida vira um filtro PK na frequência dela; bandas no zero ficam de fora', () => {
    expect(lines(withBands([[3, 2], [8, -2]]))).toEqual([
      'Preamp: -2.0 dB',
      'Filter 1: ON PK Fc 450 Hz Gain 2.0 dB Q 1.41',
      'Filter 2: ON PK Fc 7500 Hz Gain -2.0 dB Q 1.41',
    ])
  })
  it('Bass Boost vira low shelf e Clarity vira high shelf, depois das bandas', () => {
    const s = { ...withBands([[0, 1]]), bass: 5, clarity: 4 }
    expect(lines(s).slice(1)).toEqual([
      'Filter 1: ON PK Fc 62 Hz Gain 1.0 dB Q 1.41',
      'Filter 2: ON LSC Fc 100 Hz Gain 5.0 dB',
      'Filter 3: ON HSC Fc 4000 Hz Gain 2.4 dB',
    ])
  })
  it('desligado: arquivo neutro mesmo com bandas mexidas (o som volta ao normal)', () => {
    expect(lines({ ...withBands([[0, 6]]), bass: 10, on: false })).toEqual(['Preamp: 0.0 dB'])
  })
})

describe('equalizador: preamp (não deixar o som estourar)', () => {
  it('compensa o maior reforço', () => {
    expect(mod.preampDb(withBands([[4, 3], [6, 5]]))).toBe(-5)
  })
  it('só cortes: preamp zero (e nunca -0)', () => {
    expect(Object.is(mod.preampDb(withBands([[2, -4]])), 0)).toBe(true)
  })
  it('Bass Boost soma com o reforço das bandas graves (os dois mexem na mesma região)', () => {
    expect(mod.preampDb({ ...withBands([[0, 3]]), bass: 5 })).toBe(-8)
  })
  it('Clarity soma com o reforço das bandas agudas', () => {
    expect(mod.preampDb({ ...withBands([[9, 2]]), clarity: 10 })).toBe(-8)
  })
  it('grave e agudo em regiões diferentes não se somam', () => {
    expect(mod.preampDb({ ...flat(), bass: 4, clarity: 5 })).toBe(-4)
  })
})

describe('equalizador: validação do que chega da tela', () => {
  it('aceita o estado plano', () => {
    expect(mod.validState(flat())).toBe(true)
  })
  it.each([
    ['bandas a menos', { bands: Array(9).fill(0) }],
    ['banda acima do limite', { bands: [13, 0, 0, 0, 0, 0, 0, 0, 0, 0] }],
    ['banda quebrada', { bands: [1.5, 0, 0, 0, 0, 0, 0, 0, 0, 0] }],
    ['banda que não é número', { bands: ['1', 0, 0, 0, 0, 0, 0, 0, 0, 0] }],
    ['bass acima de 10', { bass: 11 }],
    ['clarity negativo', { clarity: -1 }],
    ['on que não é booleano', { on: 'sim' }],
    ['volume acima de +12', { volume: 13 }],
    ['volume negativo (para abaixar existe o volume do Windows)', { volume: -1 }],
    ['sem volume', { volume: undefined }],
    ['preset desconhecido', { preset: 'hacker' }],
  ])('recusa %s', (_nome, troca) => {
    expect(mod.validState({ ...flat(), ...troca })).toBe(false)
  })
  it('aceita "personalizado" (o usuário mexeu numa banda depois do preset)', () => {
    expect(mod.validState({ ...flat(), preset: 'personalizado', bands: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0] })).toBe(true)
  })
  it('todo preset do Laaazy é um estado válido (ninguém digita valor fora do limite)', () => {
    for (const p of PRESETS) {
      expect(mod.validState({ on: true, preset: p.id, bands: p.bands, bass: p.bass, clarity: p.clarity, volume: p.volume }), p.id).toBe(true)
    }
  })
  it('recusa o que não é objeto', () => {
    for (const v of [null, undefined, 'x', 3, []]) expect(mod.validState(v)).toBe(false)
  })
})

describe('equalizador: Include no config.txt do usuário', () => {
  const INC = mod.INCLUDE_LINE
  it('acrescenta o Include no fim, sem mexer no que o usuário tinha', () => {
    expect(mod.withInclude('Preamp: -2 dB\nInclude: example.txt\n')).toBe(`Preamp: -2 dB\nInclude: example.txt\n${INC}\n`)
  })
  it('não repete o Include', () => {
    const once = mod.withInclude('')
    expect(mod.withInclude(once)).toBe(once)
  })
  it('arquivo sem quebra de linha no fim', () => {
    expect(mod.withInclude('Preamp: -2 dB')).toBe(`Preamp: -2 dB\n${INC}\n`)
  })
  // Regressão (achado no PC do Bruno, 2026-10-14): o config.txt que o instalador do APO cria tem
  // Preamp -6 dB e inclui o example.txt (reforço de grave); somado ao Laaazy, o "Geral" não era neutro
  const APO_DEFAULT = 'Preamp: -6 dB\r\nInclude: example.txt\r\nGraphicEQ: 25 0; 40 0; 63 0; 100 0; 160 0; 250 0; 400 0; 630 0; 1000 0; 1600 0; 2500 0; 4000 0; 6300 0; 10000 0; 16000 0'
  it('config.txt padrão do instalador (o usuário nunca mexeu): fica só a linha do Laaazy', () => {
    expect(mod.withInclude(APO_DEFAULT)).toBe(`${INC}\r\n`)
  })
  it('o padrão é reconhecido também com LF e quebra de linha no fim', () => {
    expect(mod.withInclude(APO_DEFAULT.replaceAll('\r\n', '\n') + '\n')).toBe(`${INC}\n`)
  })
  it('padrão que já ganhou o Include do Laaazy (versão anterior) também é limpo', () => {
    expect(mod.withInclude(`${APO_DEFAULT}\r\n${INC}\r\n`)).toBe(`${INC}\r\n`)
  })
  it('o usuário mexeu em qualquer coisa: nada é apagado, só acrescenta o Include', () => {
    const mexido = APO_DEFAULT.replace('Preamp: -6 dB', 'Preamp: -3 dB')
    expect(mod.withInclude(mexido)).toBe(`${mexido}\r\n${INC}\r\n`)
  })
  it('config do Windows com CRLF: mantém o CRLF e reconhece o Include que já existe', () => {
    const crlf = 'Preamp: -2 dB\r\n'
    const out = mod.withInclude(crlf)
    expect(out).toBe(`Preamp: -2 dB\r\n${INC}\r\n`)
    expect(mod.withInclude(out)).toBe(out)
  })
})

describe('equalizador: instalador do Equalizer APO (baixado na hora)', () => {
  const s = mod.APO_SETUP
  it('versão fixa, baixada do SourceForge oficial por https', () => {
    expect(s.version).toBe('1.4.2')
    expect(s.url).toBe('https://downloads.sourceforge.net/project/equalizerapo/1.4.2/EqualizerAPO-x64-1.4.2.exe')
    expect(s.fileName).toBe('EqualizerAPO-x64-1.4.2.exe')
  })
  it('SHA-256 conferido em duas fontes (instalador do SourceForge e pacote do Chocolatey)', () => {
    expect(s.sha256).toBe('7403be7427bbe1936a40dded082829b6e217fc4f5990fee5cba501f0ae055afa')
  })
  it('instala sem janelas (/S)', () => {
    expect(s.args).toEqual(['/S'])
  })
})

// Volume extra (pedido do Bruno, 2026-10-14): volume do Windows em 100% e ainda baixo
describe('equalizador: volume extra', () => {
  it('soma no preamp: tudo plano com +6 dB sai 6 dB mais alto', () => {
    expect(mod.preampDb({ ...flat(), volume: 6 })).toBe(6)
    expect(lines({ ...flat(), volume: 6 })).toEqual(['Preamp: 6.0 dB'])
  })
  it('soma depois do desconto dos reforços (Bass Boost -8 dB + volume 6 = -2 dB)', () => {
    expect(mod.preampDb({ ...flat(), bands: [3, 3, 2, 0, 0, 0, 0, 0, 0, 0], bass: 5, volume: 6 })).toBe(-2)
  })
  it('desligado: volume extra também some (som original)', () => {
    expect(lines({ ...flat(), volume: 12, on: false })).toEqual(['Preamp: 0.0 dB'])
  })
  it('ajuste salvo antes do volume extra continua valendo, com volume 0', () => {
    const antigo = { on: true, preset: 'jogos', bands: [2, 1, -1, 0, 0, 1, 3, 3, 2, 1], bass: 2, clarity: 3 }
    expect(mod.upgrade(antigo)).toEqual({ ...antigo, volume: 0 })
    expect(mod.validState(mod.upgrade(antigo))).toBe(true)
  })
  it('upgrade não inventa nada para o que não é ajuste', () => {
    for (const v of [null, undefined, 'x', []]) expect(mod.upgrade(v)).toBe(v)
    const novo = { ...flat(), volume: 4 }
    expect(mod.upgrade(novo)).toBe(novo)
  })
})
