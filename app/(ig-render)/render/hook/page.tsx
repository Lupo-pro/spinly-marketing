type Props = {
  searchParams: {
    title?: string
    titleAccent?: string
    subtitle?: string
    pageNum?: string
    character?: string
  }
}

export default function HookPage({ searchParams }: Props) {
  const {
    title = '5 SEÑALES DE QUE TU AGENCIA TE ESTÁ',
    titleAccent = 'ESTAFANDO',
    subtitle = 'No siempre es fácil darse cuenta. Pero estas señales no mienten.',
    pageNum = '01',
    character = ''
  } = searchParams

  const charClass = character ? 'character' : 'character placeholder'
  const charStyle = character ? { backgroundImage: `url(${character})` } : undefined

  return (
    <div className="slide hook">
      <div className="character-glow" />
      <div className={charClass} style={charStyle} />
      <div className="label-top">HOOK</div>
      <div className="brand-top-right">SPINLY</div>
      <div className="title">
        {title} <em>{titleAccent}</em>
      </div>
      <div className="subtitle">{subtitle}</div>
      <div className="footer-handle">@spinly</div>
      <div className="footer-pages">
        <strong>{pageNum}</strong> / 10
      </div>
    </div>
  )
}
