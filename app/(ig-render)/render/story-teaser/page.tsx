import './styles.css'

type Props = {
  searchParams: {
    title?: string
    teaserText?: string
  }
}

function applyAccent(line: string): string {
  return line.replace(/\*([^*]+)\*/g, '<span class="accent">$1</span>')
}

export default function StoryTeaserPage({ searchParams }: Props) {
  const { title: titleRaw = 'NUEVO POST|EN MI *FEED*', teaserText = 'El post completo en mi feed.' } =
    searchParams

  const titleLines = titleRaw.split('|').slice(0, 4)

  return (
    <div className="slide story story-teaser">
      <div className="brand-top-right">SPINLY</div>

      <div className="st-badge">
        <span>NUEVO POST</span>
      </div>

      <div className="st-title-stack">
        {titleLines.map((line, i) => (
          <div key={i} className="st-title-line" dangerouslySetInnerHTML={{ __html: applyAccent(line) }} />
        ))}
      </div>

      <div className="st-arrow-block">
        <div className="st-text">{teaserText}</div>
        <svg className="st-arrow" viewBox="0 0 80 100" width="80" height="100" aria-hidden="true">
          <path
            d="M40 10 L40 80 M20 60 L40 85 L60 60"
            stroke="white"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className="st-feed-text">VER EN EL FEED</div>
      </div>

      <div className="footer-handle">@spinly.lat</div>
    </div>
  )
}
