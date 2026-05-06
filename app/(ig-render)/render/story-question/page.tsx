import './styles.css'

type Props = {
  searchParams: {
    questionLines?: string
    sub?: string
    cta?: string
    ctaUrl?: string
  }
}

function applyAccent(line: string): string {
  return line.replace(/\*([^*]+)\*/g, '<span class="accent">$1</span>')
}

export default function StoryQuestionPage({ searchParams }: Props) {
  const {
    questionLines: questionRaw = '¿QUÉ|*FALTA*?',
    sub = '',
    cta = 'audita gratis',
    ctaUrl = 'spinly.lat/audit'
  } = searchParams

  const questionLines = questionRaw.split('|').slice(0, 5)

  return (
    <div className="slide story story-question">
      <div className="big-question">?</div>

      <div className="brand-top-right">SPINLY</div>

      <div className="sq-stack">
        {questionLines.map((line, i) => (
          <div key={i} className="sq-line" dangerouslySetInnerHTML={{ __html: applyAccent(line) }} />
        ))}
      </div>

      {sub && <div className="sq-sub">{sub}</div>}

      <div className="sq-cta-block">
        <div className="sq-cta-text-stack">
          <div className="sq-cta-text">{cta}</div>
          <div className="sq-cta-url">{ctaUrl}</div>
        </div>
        <svg className="sq-cta-arrow" viewBox="0 0 40 40" width="48" height="48" aria-hidden="true">
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
