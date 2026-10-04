import { UserRound } from 'lucide-react'

const BLOB = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com'
const HINTS = [
  { cls: 'confirm-command-icon', src: `${BLOB}/image-RmsaVZFRGft3ZQ23np6JD9Ct1RZztJ.png`, label: 'Confirmar' },
  { cls: 'back-command-icon', src: `${BLOB}/image-efPFMsWuBwJacjHRT3XAlB7m1bJ8gX.png`, label: 'Voltar' },
  { cls: 'details-command-icon', src: `${BLOB}/image-fbLU9pFFvFFk5kDdTWVlmaNWxKsSDw.png`, label: 'Detalhes' },
  { cls: 'search-command-icon', src: `${BLOB}/image-GXcI3yAQ20XUtdiI4nztFeFYyfwOai.png`, label: 'Buscar' },
]

export default function Footer({ library }: { library: boolean }) {
  return (
    <footer className="ps4-footer">
      <div className="ps4-hints" aria-label={library ? 'Comandos da Biblioteca' : 'Comandos do menu'}>
        {HINTS.map((h) => <span key={h.label}><img className={h.cls} src={h.src} alt="" /><strong>{h.label}</strong></span>)}
      </div>
      <div className="ps4-live"><UserRound size={22} /><div><strong>Bruno está online</strong><small>Biblioteca pronta para jogar</small></div></div>
    </footer>
  )
}
