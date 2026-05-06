type Props = {
  searchParams: {
    number?: string
    title?: string
    body?: string
    bodyStrong?: string
    question?: string
    pageNum?: string
    character?: string
  }
}

export default function SenalPage({ searchParams }: Props) {
  const {
    number = '01',
    title = 'SOLO TE MUESTRAN<br>RESULTADOS BUENOS.',
    body = 'Nunca los malos. Nunca las pérdidas.',
    bodyStrong = 'Una buena agencia te muestra todo:',
    question = '¿Tu agencia te muestra los errores que cometió?',
    pageNum,
    character = ''
  } = searchParams

  const effectivePageNum = pageNum ?? String(parseInt(number) + 2).padStart(2, '0')

  const charStyle = character ? { backgroundImage: `url(${character})` } : undefined

  return (
    <div className="slide senal">
      <div className="big-number">{number}</div>
      {character && <div className="character" style={charStyle} />}
      <div className="brand-top-right">SPINLY</div>
      <div className="title" dangerouslySetInnerHTML={{ __html: title }} />
      <div className="body">
        {bodyStrong && <strong>{bodyStrong} </strong>}
        {body}
      </div>
      {question && <div className="question-box">{question}</div>}
      <div className="footer-handle">@spinly.lat</div>
      <div className="footer-pages">
        <strong>{effectivePageNum}</strong> / 10
      </div>
    </div>
  )
}
