'use client'

import { useMemo } from 'react'
import type { CSSProperties } from 'react'

/* ------------------------------------------------------------------ */
/*  Partículas                                                         */
/* ------------------------------------------------------------------ */

type Particle = {
  id: number
  left: number     // % da largura
  size: number     // px
  peak: number     // opacidade máxima (0-1)
  duration: number // s
  delay: number    // s (aplicado negativo: a poeira já começa espalhada)
  drift: number    // px de deslocamento lateral ao subir
}

// PRNG determinístico: o HTML gerado no build e o do cliente são idênticos
// (sem erro de hidratação), mas os valores continuam com cara de aleatórios.
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function createParticles(count: number, seed: number): Particle[] {
  const rand = mulberry32(seed)
  const range = (min: number, max: number) => Math.round((min + rand() * (max - min)) * 100) / 100
  return Array.from({ length: count }, (_, id) => ({
    id,
    left: range(0, 100),
    size: range(1.5, 4.5),
    peak: range(0.35, 0.9),
    duration: range(16, 34),
    delay: range(0, 34),
    drift: range(-60, 60),
  }))
}

/* ------------------------------------------------------------------ */
/*  Componente                                                         */
/* ------------------------------------------------------------------ */

type PS4BackgroundProps = {
  /** Imagem de fundo estática (em /public). Use null se o pai já tiver a imagem. */
  image?: string | null
  /** Quantidade de partículas de poeira. */
  particleCount?: number
  /** Muda o "sorteio" das partículas. */
  seed?: number
  /** Se true, respeita "reduzir movimento" do Windows e desliga as animações. */
  respectReducedMotion?: boolean
  className?: string
}

export default function PS4Background({
  image = '/ps4-bg.jpg',
  particleCount = 44,
  seed = 20131115,
  respectReducedMotion = false,
  className = '',
}: PS4BackgroundProps) {
  const particles = useMemo(() => createParticles(particleCount, seed), [particleCount, seed])
  const still = respectReducedMotion ? 'motion-reduce:animate-none' : ''
  const hide = respectReducedMotion ? 'motion-reduce:hidden' : ''

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 -z-10 overflow-hidden ${className}`}
    >
      {/* 0. Imagem estática */}
      {image && (
        <div
          className="bgfx-image absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${image})` }}
        />
      )}

      {/* 1. Brilho radial no centro */}
      <div className={`bgfx-glow animate-glow-pulse ${still}`} />

      {/* 2. Duas camadas de ondas, dessincronizadas */}
      <div className={`bgfx-wave-a animate-wave-slow ${still}`} />
      <div
        className={`bgfx-wave-b animate-wave-fast ${still}`}
        style={{ animationDelay: '-9s' }}
      />

      {/* 3. Poeira luminosa subindo */}
      <div className={`absolute inset-0 ${hide}`}>
        {particles.map((p) => (
          <span
            key={p.id}
            className="bgfx-particle animate-float-particle"
            style={
              {
                left: `${p.left}%`,
                width: p.size,
                height: p.size,
                animationDuration: `${p.duration}s`,
                animationDelay: `-${p.delay}s`,
                '--peak': p.peak,
                '--drift': `${p.drift}px`,
              } as CSSProperties
            }
          />
        ))}
      </div>
    </div>
  )
}
