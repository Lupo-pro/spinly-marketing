type Props = {
  searchParams: {
    titlePart1?: string
    titleAccent1?: string
    titlePart2?: string
    titleAccent2?: string
    titlePart3?: string
    subtitle?: string
    subtitleStrong?: string
    watermark?: string
    pageNum?: string
    single?: string
  }
}

export default function TesisPage({ searchParams }: Props) {
  const {
    titlePart1 = 'UNA AGENCIA QUE FALLA NO SIEMPRE LO HACE CON ',
    titleAccent1 = 'NÚMEROS MALOS',
    titlePart2 = '. LO HACE CON LOS ',
    titleAccent2 = 'NÚMEROS EQUIVOCADOS',
    titlePart3 = '.',
    subtitleStrong = 'Los reportes pueden verse bien mientras tu dinero desaparece.',
    subtitle = 'Estas son las 5 señales que debes conocer.',
    watermark = 'AGENCIA',
    pageNum = '02',
    single
  } = searchParams

  const isSingle = single === 'true'

  return (
    <div className={`slide tesis${isSingle ? ' single-mode' : ''}`}>
      <div className="watermark">{watermark}</div>
      <div className="brand-top-right">SPINLY</div>
      <div className="content">
        <div className="title">
          {titlePart1}
          <em>{titleAccent1}</em>
          {titlePart2}
          <em>{titleAccent2}</em>
          {titlePart3}
        </div>
        <div className="subtitle">
          {subtitleStrong && <strong>{subtitleStrong} </strong>}
          {subtitle}
        </div>
      </div>
      <div className="footer-handle">@spinly.lat</div>
      <div className="footer-pages">
        <strong>{pageNum}</strong> / 10
      </div>
    </div>
  )
}
