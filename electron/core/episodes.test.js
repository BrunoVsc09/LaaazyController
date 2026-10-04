import { describe, it, expect } from 'vitest'
import mod from './episodes.js'

const ep = (air_date, s = 2, e = 5) => ({ air_date, season_number: s, episode_number: e })

describe('episodeNews', () => {
  const today = '2026-10-04'
  it('episódio que saiu nos últimos 7 dias (inclusive hoje)', () => {
    expect(mod.episodeNews({ last_episode_to_air: ep('2026-10-04') }, today)).toEqual({ kind: 'new', date: '2026-10-04', label: 'Episódio novo: T2E5' })
    expect(mod.episodeNews({ last_episode_to_air: ep('2026-09-27') }, today).kind).toBe('new')
  })
  it('episódio antigo não conta', () => {
    expect(mod.episodeNews({ last_episode_to_air: ep('2026-09-26') }, today)).toBeNull()
  })
  it('próximo episódio nos próximos 7 dias', () => {
    expect(mod.episodeNews({ next_episode_to_air: ep('2026-10-09', 3, 1) }, today)).toEqual({ kind: 'soon', date: '2026-10-09', label: 'Episódio novo em 09/10: T3E1' })
    expect(mod.episodeNews({ next_episode_to_air: ep('2026-10-12') }, today)).toBeNull()
  })
  it('episódio novo tem prioridade sobre o próximo', () => {
    expect(mod.episodeNews({ last_episode_to_air: ep('2026-10-03'), next_episode_to_air: ep('2026-10-05') }, today).kind).toBe('new')
  })
  it('sem dados ou data inválida', () => {
    expect(mod.episodeNews({}, today)).toBeNull()
    expect(mod.episodeNews(null, today)).toBeNull()
    expect(mod.episodeNews({ last_episode_to_air: ep('') }, today)).toBeNull()
  })
})
