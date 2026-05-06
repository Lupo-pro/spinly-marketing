type Props = {
  searchParams: {
    question?: string
    subtitle?: string
    pageNum?: string
    character?: string
  }
}

// CTAs are now hardcoded (A. GUARDA ESTO + B. AUDITÁ GRATIS) per Phase 8.
// Old `ctaPrimary` / `ctaSecondary` query params are accepted but ignored
// for backward compat with already-stored slide_image_urls.
export default function CierrePage({ searchParams }: Props) {
  const {
    question = '¿IDENTIFICASTE ALGUNA DE ESTAS 5 SEÑALES?',
    subtitle = 'Audita tu Google gratis. En 24 hs tienes el diagnóstico completo.',
    pageNum = '10',
    character = ''
  } = searchParams

  const charStyle = character ? { backgroundImage: `url(${character})` } : undefined

  return (
    <div className="slide cierre">
      {character && <div className="character-glow" />}
      {character && <div className="character" style={charStyle} />}
      <div className="brand-top-right">SPINLY</div>
      <div className="question">{question}</div>
      <div className="subtitle">{subtitle}</div>

      <div className="cta-row">
        <div className="cta-button cta-passive">
          <div className="cta-letter">A. GUARDA</div>
          <div className="cta-letter">ESTO</div>
          <div className="cta-sub">y compártelo con tu equipo</div>
          <svg className="cta-arrow" viewBox="0 0 30 30" width="36" height="36" aria-hidden="true">
            <path
              d="M15 5 L15 22 M8 17 L15 24 L22 17"
              stroke="white"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className="cta-button cta-active">
          <div className="cta-letter">B. AUDITÁ</div>
          <div className="cta-letter">GRATIS</div>
          <div className="cta-sub">en spinly.lat/audit · 1 min</div>
          <svg className="cta-arrow" viewBox="0 0 30 30" width="36" height="36" aria-hidden="true">
            <path
              d="M8 22 L22 8 M14 8 L22 8 L22 16"
              stroke="white"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      <div className="cta-fineprint">30 días gratis · sin tarjeta · sin compromiso</div>

      <div className="footer-handle">@spinly.lat</div>
      <div className="footer-pages">
        <strong>{pageNum}</strong> / 10
      </div>
    </div>
  )
}
