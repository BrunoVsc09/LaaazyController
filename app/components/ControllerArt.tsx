'use client'

// Desenho do controle no editor de perfis: o botão escolhido fica amarelo; os fixos, apagados.
type Props = { selected: string | null; locked: string[]; onPick: (id: string) => void }

type Shape = { id: string; label?: string } & (
  | { kind: 'rect'; x: number; y: number; w: number; h: number; r?: number }
  | { kind: 'circle'; x: number; y: number; r: number }
)

const SHAPES: Shape[] = [
  { id: 'L2', label: 'L2', kind: 'rect', x: 56, y: 6, w: 50, h: 15, r: 6 },
  { id: 'L1', label: 'L1', kind: 'rect', x: 56, y: 25, w: 50, h: 15, r: 6 },
  { id: 'R2', label: 'R2', kind: 'rect', x: 194, y: 6, w: 50, h: 15, r: 6 },
  { id: 'R1', label: 'R1', kind: 'rect', x: 194, y: 25, w: 50, h: 15, r: 6 },
  { id: 'Touchpad', kind: 'rect', x: 126, y: 50, w: 48, h: 24, r: 4 },
  { id: 'Share', kind: 'rect', x: 106, y: 54, w: 14, h: 8, r: 4 },
  { id: 'Options', kind: 'rect', x: 180, y: 54, w: 14, h: 8, r: 4 },
  { id: 'PS', label: 'PS', kind: 'circle', x: 150, y: 92, r: 8 },
  { id: 'DpadCima', kind: 'rect', x: 62, y: 74, w: 11, h: 13, r: 2 },
  { id: 'DpadBaixo', kind: 'rect', x: 62, y: 99, w: 11, h: 13, r: 2 },
  { id: 'DpadEsquerda', kind: 'rect', x: 48, y: 87, w: 13, h: 11, r: 2 },
  { id: 'DpadDireita', kind: 'rect', x: 74, y: 87, w: 13, h: 11, r: 2 },
  { id: 'Triangulo', label: '△', kind: 'circle', x: 234, y: 76, r: 8 },
  { id: 'Quadrado', label: '□', kind: 'circle', x: 219, y: 92, r: 8 },
  { id: 'Circulo', label: '○', kind: 'circle', x: 249, y: 92, r: 8 },
  { id: 'Cruz', label: '✕', kind: 'circle', x: 234, y: 108, r: 8 },
  { id: 'L3', label: 'L3', kind: 'circle', x: 112, y: 128, r: 15 },
  { id: 'R3', label: 'R3', kind: 'circle', x: 188, y: 128, r: 15 },
]

export default function ControllerArt({ selected, locked, onPick }: Props) {
  return (
    <svg className="pad-art" viewBox="0 0 300 172" role="img" aria-label="Controle">
      <path d="M70 44 Q150 34 230 44 Q268 52 274 118 Q278 166 244 164 Q222 162 204 126 L96 126 Q78 162 56 164 Q22 166 26 118 Q32 52 70 44Z" className="pad-body" />
      {SHAPES.map((s) => {
        const cls = `pad-key ${selected === s.id ? 'sel' : ''} ${locked.includes(s.id) ? 'lock' : ''}`
        const cx = s.kind === 'rect' ? s.x + s.w / 2 : s.x
        const cy = s.kind === 'rect' ? s.y + s.h / 2 : s.y
        return (
          <g key={s.id} className={cls} onClick={() => onPick(s.id)}>
            {s.kind === 'rect'
              ? <rect x={s.x} y={s.y} width={s.w} height={s.h} rx={s.r ?? 3} />
              : <circle cx={s.x} cy={s.y} r={s.r} />}
            {s.label && <text x={cx} y={cy + 3.5} textAnchor="middle">{s.label}</text>}
          </g>
        )
      })}
    </svg>
  )
}
