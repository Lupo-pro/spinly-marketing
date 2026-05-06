import './styles.css'

type Props = {
  searchParams: {
    questionLines?: string
    sub?: string
    pageNum?: string
    single?: string
  }
}

function applyAccent(line: string): string {
  return line.replace(/\*([^*]+)\*/g, '<span class="accent">$1</span>')
}

export default function QuestionPage({ searchParams }: Props) {
  const {
    questionLines: questionRaw = '¿QUÉ|*FALTA*?',
    sub: subRaw = '',
    pageNum = '03',
    single
  } = searchParams

  const isSingle = single === 'true'
  const questionLines = questionRaw.split('|').slice(0, 5)
  const subLines = subRaw.split('\n').slice(0, 3).filter(Boolean)

  return (
    <div className={`slide question${isSingle ? ' single-mode' : ''}`}>
      <div className="big-question">?</div>

      <div className="brand-top-right">SPINLY</div>

      <div className="q-stack">
        {questionLines.map((line, i) => (
          <div key={i} className="q-line" dangerouslySetInnerHTML={{ __html: applyAccent(line) }} />
        ))}
      </div>

      {subLines.length > 0 && (
        <div className="q-sub">
          {subLines.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      )}

      <div className="footer-handle">@spinly.lat</div>
      <div className="footer-pages">
        <strong>{pageNum}</strong> / 10
      </div>
    </div>
  )
}
