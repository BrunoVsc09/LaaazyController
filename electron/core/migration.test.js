import { describe, it, expect } from 'vitest'
import mod from './migration.js'

const { planMigration, MIGRATABLE } = mod

describe('planMigration (Lazy PS4 → Laaazy)', () => {
  it('copia da primeira pasta antiga que tem dados, só o que ainda não existe na nova', () => {
    const plan = planMigration({
      candidates: [
        { dir: 'C:/AppData/lazy-ps4', files: [] },
        { dir: 'C:/AppData/Lazy PS4', files: ['settings.json', 'games.json', 'ds4-profiles.json'] },
      ],
      newFiles: ['games.json'],
    })
    expect(plan).toEqual({ from: 'C:/AppData/Lazy PS4', files: ['settings.json', 'ds4-profiles.json'] })
  })
  it('a chave do TMDB (secrets.json) não é copiada: só a pasta antiga consegue abrir', () => {
    expect(MIGRATABLE).not.toContain('secrets.json')
    const plan = planMigration({ candidates: [{ dir: 'A', files: ['secrets.json', 'settings.json'] }], newFiles: [] })
    expect(plan.files).toEqual(['settings.json'])
  })
  it('nada para copiar: null', () => {
    expect(planMigration({ candidates: [{ dir: 'A', files: ['outro.txt'] }], newFiles: [] })).toBeNull()
    expect(planMigration({ candidates: [{ dir: 'A', files: ['settings.json'] }], newFiles: ['settings.json'] })).toBeNull()
    expect(planMigration({ candidates: [], newFiles: [] })).toBeNull()
  })
})
