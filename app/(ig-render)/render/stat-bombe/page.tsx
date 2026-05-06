import './styles.css'

type Props = {
  searchParams: {
    stat?: string
    label?: string
    sub?: string
    pageNum?: string
  }
}

export default function StatBombePage({ searchParams }: Props) {
  const {
    stat = 'x6',
    label = 'MÁS RESEÑAS\nEN GOOGLE MAPS',
    sub = 'vs cafés sin Spinly',
    pageNum = '09'
  } = searchParams

  const labelLines = label.split('\n').slice(0, 2)

  return (
    <div className="slide stat-bombe">
      <div className="brand-top-right">SPINLY</div>

      <div className="sb-stack">
        <div className="sb-stat">{stat}</div>
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
