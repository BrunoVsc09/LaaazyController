import { hintsFor } from '../lib/footer-hints'
import type { Screen } from '../lib/screen-state'

export default function Footer({ screen }: { screen: Screen }) {
  return (
    <footer className="ps4-footer">
      <div className="ps4-hints" aria-label="Comandos do controle">
        {hintsFor(screen).map((h) => <span key={h.label}><img className={h.cls} src={h.icon} alt="" /><strong>{h.label}</strong></span>)}
      </div>
    </footer>
  )
}
