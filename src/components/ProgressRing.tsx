import type { ReactNode } from 'react'
import { adherenceColor } from '@/lib/colors'

interface ProgressRingProps {
  /** 0..100 */
  value: number
  size?: number
  stroke?: number
  /** Override the auto adherence color. */
  color?: string
  trackColor?: string
  children?: ReactNode
  className?: string
}

/** Circular progress indicator — used for weekly adherence. */
export function ProgressRing({
  value,
  size = 120,
  stroke = 10,
  color,
  trackColor = '#e2e8f0',
  children,
  className,
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, value))
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const dash = (clamped / 100) * circ
  const ringColor = color ?? adherenceColor(clamped)

  return (
    <div
      className={className}
      style={{ width: size, height: size, position: 'relative' }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={trackColor}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={ringColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ - dash}`}
          style={{ transition: 'stroke-dasharray 0.6s ease, stroke 0.3s ease' }}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {children}
        </div>
      )}
    </div>
  )
}
