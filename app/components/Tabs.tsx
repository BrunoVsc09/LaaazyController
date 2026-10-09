import type { Screen } from '../lib/screen-state'
import type { Sounds } from '../hooks/useSounds'

const TABS: { label: string; screen: Screen }[] = [
  { label: 'Início', screen: 'home' },
  { label: 'Biblioteca', screen: 'library' },
  { label: 'Apps', screen: 'apps' },
]

export default function Tabs({ current, onGo, sounds }: { current: Screen; onGo: (s: Screen) => void; sounds: Sounds }) {
  return (
    <nav className="lz-tabs" aria-label="Seções">
      {TABS.map((t) => (
        <button key={t.screen} type="button" className={`lz-tab ${current === t.screen ? 'active' : ''}`}
          aria-current={current === t.screen ? 'page' : undefined}
          onClick={() => { sounds.click(); onGo(t.screen) }} onMouseEnter={sounds.hover}>
          {t.label}
        </button>
      ))}
      <button type="button" className={`lz-tab ${current === 'search' ? 'active' : ''}`} aria-current={current === 'search' ? 'page' : undefined}
        onClick={() => { sounds.click(); onGo('search') }} onMouseEnter={sounds.hover}>⌕ Buscar</button>
    </nav>
  )
}
