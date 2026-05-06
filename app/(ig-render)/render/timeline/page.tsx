import './styles.css'

type Props = {
  searchParams: {
    title?: string
    steps?: string
    pageNum?: string
  }
}

function applyAccent(line: string): string {
  return line.replace(/\*([^*]+)\*/g, '<span class="accent">$1</span>')
}

export default function TimelinePage({ searchParams }: Props) {
  const {
    title: titleRaw = 'CÓMO FUNCIONA|SPINLY EN *5 PASOS*.',
    steps: stepsRaw = 'Tu cliente escanea el QR^en la mesa o en la barra|Juega la ruleta^y gana un premio real|Deja reseña Google^automáticamente|Recibe cupón^en su email|Tu negocio sube^en Google Maps',
    pageNum = '08'
  } = searchParams

  const titleLines = titleRaw.split('|')
  const steps = stepsRaw
    .split('|')
    .slice(0, 5)
    .map((step, i) => {
      const [stepTitle, stepSubtitle] = step.split('^')
      return {
        num: String(i + 1).padStart(2, '0'),
        title: stepTitle ?? '',
        subtitle: stepSubtitle ?? ''
      }
    })

  return (
    <div className="slide timeline">
      <div className="brand-top-right">SPINLY</div>

      <div className="tl-title">
        {titleLines.map((line, i) => (
          <div key={i} dangerouslySetInnerHTML={{ __html: applyAccent(line) }} />
        ))}
      </div>

      <div className="tl-track">
        <div className="tl-line" />
        {steps.map((step, i) => (
          <div key={i} className="tl-step">
            <div className="tl-num">{step.num}</div>
            <div className="tl-content">
              <div className="tl-step-title">{step.title}</div>
              <div className="tl-step-sub">{step.subtitle}</div>
            </div>
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
