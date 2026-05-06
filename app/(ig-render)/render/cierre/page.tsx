type Props = {
  searchParams: {
    question?: string
    subtitle?: string
    ctaPrimary?: string
    ctaSecondary?: string
    pageNum?: string
    character?: string
  }
}

export default function CierrePage({ searchParams }: Props) {
  const {
    question = '¿IDENTIFICASTE ALGUNA DE ESTAS 5 SEÑALES?',
    subtitle = 'Audita tu Google gratis. En 24 hs tienes el diagnóstico completo.',
    ctaPrimary = 'Audita gratis — spinly.lat',
    ctaSecondary = 'Guarda y comparte este post',
    pageNum = '10',
    character = ''
  } = searchParams

  const charClass = character ? 'character' : 'character placeholder'
  const charStyle = character ? { backgroundImage: `url(${character})` } : undefined

  return (
    <div className="slide cierre">
      <div className="character-glow" />
      <div className={charClass} style={charStyle} />
      <div className="label-cierre">· CIERRE</div>
      <div className="brand-top-right">SPINLY</div>
      <div className="question">{question}</div>
      <div className="subtitle">{subtitle}</div>
      <div className="ctas">
        <div className="cta-primary">{ctaPrimary}</div>
        {ctaSecondary && <div className="cta-secondary">{ctaSecondary}</div>}
      </div>
      <div className="footer-handle">@spinly</div>
      <div className="footer-pages">
        <strong>{pageNum}</strong> / 10
      </div>
    </div>
  )
}
