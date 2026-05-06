import './styles.css'

type Props = {
  searchParams: {
    bgWord?: string
    titleLines?: string
    accentLine?: string
    pageNum?: string
    single?: string
  }
}

export default function VisualBgPage({ searchParams }: Props) {
  const {
    bgWord = 'SPINLY',
    titleLines: titleLinesRaw = 'EL|PROBLEMA|REAL',
    accentLine = '2',
    pageNum = '02',
    single
  } = searchParams

  const isSingle = single === 'true'
  const titleLines = titleLinesRaw.split('|').slice(0, 4)
  const accentIdx = parseInt(accentLine, 10)
  const repeats = Array.from({ length: 7 }, (_, i) => i)

  return (
    <div className={`slide visual-bg${isSingle ? ' single-mode' : ''}`}>
      <div className="vb-bg">
        {repeats.map((i) => (
          <div key={i} className="vb-bg-word">
            {bgWord}
          </div>
        ))}
      </div>

      <div className="brand-top-right">SPINLY</div>

      <div className="vb-stack">
        {titleLines.map((line, i) => (
          <div key={i} className={i === accentIdx ? 'vb-line accent' : 'vb-line'}>
            {line}
          </div>
        ))}
      </div>

      <div className="footer-handle">@spinly.lat</div>
      <div className="footer-pages">
        <strong>{pageNum}</strong> / 10
      </div>
    </div>
  )
}
