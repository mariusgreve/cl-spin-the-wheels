import { useMemo, type CSSProperties } from 'react'

const COLORS = ['#d15b48', '#243447', '#f2b134', '#4c9f70', '#5b7fd1', '#e8a0bf', '#ffffff']
const SHAPES = ['rect', 'circle', 'strip'] as const

type ConfettiShape = (typeof SHAPES)[number]

type ConfettiPiece = {
  id: number
  color: string
  shape: ConfettiShape
  size: number
  duration: number
  delay: number
  burstX: number
  burstY: number
  fallY: number
  spin: number
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function createPieces(count: number): ConfettiPiece[] {
  return Array.from({ length: count }, (_, id) => {
    // Radiate outward in every direction from the origin, biased slightly upward.
    const angle = randomBetween(0, Math.PI * 2)
    const burstDistance = randomBetween(220, 520)

    return {
      id,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
      size: randomBetween(6, 14),
      duration: randomBetween(1300, 2600),
      delay: randomBetween(0, 150),
      burstX: Math.cos(angle) * burstDistance,
      burstY: Math.sin(angle) * burstDistance - 60,
      fallY: randomBetween(260, 480),
      spin: randomBetween(360, 1080) * (Math.random() < 0.5 ? -1 : 1),
    }
  })
}

export function Confetti({ active }: { active: boolean }) {
  // Re-roll piece positions only when a burst actually starts, not on every render.
  const pieces = useMemo(() => (active ? createPieces(110) : []), [active])

  if (!active) {
    return null
  }

  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((piece) => {
        // Burst/fall distances are randomized per piece, so they travel through inline custom properties.
        const style = {
          backgroundColor: piece.color,
          width: piece.shape === 'strip' ? `${piece.size * 0.4}px` : `${piece.size}px`,
          height: `${piece.size * (piece.shape === 'strip' ? 2.2 : 1.4)}px`,
          animationDuration: `${piece.duration}ms`,
          animationDelay: `${piece.delay}ms`,
          '--burst-x': `${piece.burstX}px`,
          '--burst-y': `${piece.burstY}px`,
          '--fall-y': `${piece.burstY + piece.fallY}px`,
          '--spin': `${piece.spin}deg`,
        } as CSSProperties

        return <span key={piece.id} className={`confetti-piece confetti-piece--${piece.shape}`} style={style} />
      })}
    </div>
  )
}
