type Props = {
  searchParams: {
    title?: string
    stats?: string
    tagline?: string
    watermark?: string
    pageNum?: string
  }
}

const DEFAULT_STATS = [
  { value: '×6', label: 'MÁS RESEÑAS GOOGLE' },
  { value: '68%', label: 'PARTICIPACIÓN CLIENTES' },
  { value: '+150', label: 'NEGOCIOS LATAM' }
]

export default function ProofPage({ searchParams }: Props) {
  const {
    title = 'CON SPINLY NO VAS A VER NINGUNA DE ESTAS 5 SEÑALES.',
    stats: statsJson,
    tagline = 'Transparencia total. Resultados reales.',
    watermark = 'RESULTADOS',
    pageNum = '09'
  } = searchParams

  let stats = DEFAULT_STATS
  if (statsJson) {
    try {
      stats = JSON.parse(statsJson)
    } catch {}
  }

  return (
    <div className="slide proof">
      <div className="watermark">{watermark}</div>
      <div className="brand-top-right">SPINLY</div>
      <div className="content">
        <div className="title">{title}</div>
        <div className="stats">
          {stats.map((s, i) => (
            <div key={i} className="stat">
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="tagline">{tagline}</div>
      <div className="footer-handle">@spinly.lat</div>
      <div className="footer-pages">
        <strong>{pageNum}</strong> / 10
      </div>
    </div>
  )
}
