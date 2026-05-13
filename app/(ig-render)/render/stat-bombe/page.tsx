import './styles.css'

type Props = {
  searchParams: {
    stat?: string
    label?: string
    sub?: string
    pageNum?: string
    single?: string
  }
}

export default function StatBombePage({ searchParams }: Props) {
  const {
    stat = 'x6',
    label = 'MÁS RESEÑAS\nEN GOOGLE MAPS',
    sub = 'vs cafés sin Spinly',
    pageNum = '09',
    single
  } = searchParams

  const isSingle = single === 'true'
  const labelLines = label.split('\n').slice(0, 2)

  // Visible chars only (combining marks / spaces around digits inflate the
  // count incorrectly). Adaptive sizing keeps the stat inside the 920px safe
  // box no matter what Haiku throws at it: "x6" (2) → "9/mes" (5) → "12,847".
  const statLen = Array.from(stat.trim()).length
  const statFontSize =
    statLen <= 2 ? 480 : statLen === 3 ? 380 : statLen === 4 ? 300 : statLen === 5 ? 240 : 200
  const statLetterSpacing = statLen <= 3 ? -20 : statLen === 4 ? -14 : -8

  return (
    <div className={`slide stat-bombe${isSingle ? ' single-mode' : ''}`}>
      <div className="brand-top-right">SPINLY</div>

      <div className="sb-stack">
        <div
          className="sb-stat"
          style={{ fontSize: `${statFontSize}px`, letterSpacing: `${statLetterSpacing}px` }}
        >
          {stat}
        </div>
        <div className="sb-label">
          {labelLines.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
        <div className="sb-sub">{sub}</div>
      </div>

      <div className="footer-handle">@spinly.lat</div>
      <div className="footer-pages">
        <strong>{pageNum}</strong> / 10
      </div>
    </div>
  )
}
