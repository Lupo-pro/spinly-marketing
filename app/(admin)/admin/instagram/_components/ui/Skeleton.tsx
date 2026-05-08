import { CSSProperties } from 'react'

interface SkeletonProps {
  width?: number | string
  height?: number | string
  borderRadius?: number | string
  style?: CSSProperties
  className?: string
  ariaLabel?: string
}

export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = 6,
  style,
  className,
  ariaLabel = 'Chargement…'
}: SkeletonProps) {
  return (
    <span
      role="status"
      aria-label={ariaLabel}
      aria-busy="true"
      className={className}
      style={{
        display: 'block',
        width,
        height,
        borderRadius,
        background:
          'linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%)',
        backgroundSize: '200% 100%',
        animation: 'spinly-skeleton-pulse 1.4s ease-in-out infinite',
        ...style
      }}
    />
  )
}

export function SkeletonCard({ height = 280, style }: { height?: number; style?: CSSProperties }) {
  return (
    <div
      style={{
        background: 'var(--spinly-bg-elevated, rgba(255,255,255,0.03))',
        border: '1px solid var(--spinly-border-subtle, rgba(255,255,255,0.06))',
        borderRadius: 14,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        ...style
      }}
    >
      <Skeleton height={height * 0.55} borderRadius={10} />
      <Skeleton height={14} width="40%" />
      <Skeleton height={12} width="80%" />
      <Skeleton height={12} width="65%" />
    </div>
  )
}

export function SkeletonGrid({ count = 6, minItem = 260 }: { count?: number; minItem?: number }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fill, minmax(${minItem}px, 1fr))`,
        gap: 16,
        marginTop: 16
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
