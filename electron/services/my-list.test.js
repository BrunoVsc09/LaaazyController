import { describe, it, expect } from 'vitest'
import mod from './my-list.js'

const item = (id, title = id) => ({ id, kind: 'Série', title, year: '', overview: '', poster: '', backdrop: '', popularity: 0, services: ['Netflix'] })

function make(initial = []) {
  let data = initial
  return { list: mod.createMyList({ read: async () => data, write: async (d) => { data = d; return true } }), data: () => data }
}

describe('Minha lista', () => {
  it('toggle adiciona no começo e remove', async () => {
    const { list, data } = make([item('tv:1')])
    expect(await list.toggle(item('movie:2'))).toEqual({ ok: true, added: true })
    expect(data().map((x) => x.id)).toEqual(['movie:2', 'tv:1'])
    expect(await list.toggle(item('tv:1'))).toEqual({ ok: true, added: false })
    expect(data().map((x) => x.id)).toEqual(['movie:2'])
  })
  it('recusa item inválido', async () => {
    const { list, data } = make()
    expect((await list.toggle({ id: 'lixo', title: 'x' })).ok).toBe(false)
    expect((await list.toggle({ id: 'tv:1' })).ok).toBe(false)
    expect((await list.toggle(null)).ok).toBe(false)
    expect(data()).toEqual([])
  })
  it('guarda só os campos conhecidos', async () => {
    const { list, data } = make()
    await list.toggle({ ...item('tv:1'), hacker: '<script>' })
    expect(Object.keys(data()[0])).not.toContain('hacker')
  })
  it('limite de 200', async () => {
    const { list, data } = make(Array.from({ length: 200 }, (_, i) => item(`tv:${i}`)))
    await list.toggle(item('tv:999'))
    expect(data()).toHaveLength(200)
    expect(data()[0].id).toBe('tv:999')
  })
  it('get devolve a lista', async () => {
    expect(await make([item('tv:1')]).list.get()).toHaveLength(1)
  })
})
