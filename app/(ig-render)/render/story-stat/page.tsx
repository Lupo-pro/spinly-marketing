import './styles.css'

type Props = {
  searchParams: {
    stat?: string
    label?: string
    sub?: string
    cta?: string
    ctaUrl?: string
  }
}

export default function StoryStatPage({ searchParams }: Props) {
  const {
    stat = 'x6',
    label = 'MÁS RESEÑAS\nEN GOOGLE',
    sub = 'vs cafés sin Spinly',
    cta = 'audita gratis',
    ctaUrl = 'spinly.lat/audit'
  } = searchParams

  const labelLines = label.split('\n').slice(0, 2)

  return (
    <div className="slide story story-stat">
      <div className="brand-top-right">SPINLY</div>

      <div className="ss-content">
        <div className="ss-stat">{stat}</div>
        <div className="ss-label">
          {labelLines.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
        {sub && <div className="ss-sub">{sub}</div>}
      </div>

      <div className="ss-cta-block">
        <div className="ss-cta-text-stack">
          <div className="ss-cta-text">{cta}</div>
          <div className="ss-cta-url">{ctaUrl}</div>
        </div>
        <svg className="ss-cta-arrow" viewBox="0 0 40 40" width="48" height="48" aria-hidden="true">
          <path
            d="M10 30 L30 10 M18 10 L30 10 L30 22"
            stroke="white"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className="footer-handle">@spinly.lat</div>
    </div>
  )
}
