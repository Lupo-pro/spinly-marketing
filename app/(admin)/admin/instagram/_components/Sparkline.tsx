interface SparklineProps {
  data: number[]
  height?: number
  color?: string
  ariaLabel?: string
}

export function Sparkline({
  data,
  height = 40,
  color = 'var(--spinly-brand-orange)',
  ariaLabel = 'Évolution sur 30 jours'
}: SparklineProps) {
  if (data.length === 0) {
    return null
  }
  const max = Math.max(...data, 1)
  const min = 0
  const range = max - min || 1
  const width = 100 // viewBox is normalized; the SVG stretches to container width.

  const points = data
    .map((v, i) => {
      const x = data.length === 1 ? width / 2 : (i / (data.length - 1)) * width
      const y = ((max - v) / range) * 100
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')

  // Area path: same line + close to bottom on both sides.
  const areaPath =
    `M0,100 L${points
      .split(' ')
      .map((p) => p)
      .join(' L')} L${width},100 Z`

  return (
    <svg
      role="img"
      aria-label={`${ariaLabel} (max ${max})`}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ width: '100%', height, display: 'block' }}
    >
      <path d={areaPath} fill={color} fillOpacity={0.12} stroke="none" />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
