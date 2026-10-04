import { hintsFor, type Hint } from '../lib/footer-hints'
import type { Screen } from '../lib/screen-state'

export default function Footer({ screen, hints }: { screen: Screen; hints?: Hint[] }) {
  return (
    <footer className="ps4-footer">
      <div className="ps4-hints" aria-label="Comandos do controle">
        {(hints ?? hintsFor(screen)).map((h) => <span key={h.label}><img className={h.cls} src={h.icon} alt="" /><strong>{h.label}</strong></span>)}
      </div>
    </footer>
  )
}
