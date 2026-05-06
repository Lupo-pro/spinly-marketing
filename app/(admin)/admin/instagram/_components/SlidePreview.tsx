import type { Slide } from '@/lib/instagram/generator'

const AXIS_BADGE_COLORS: Record<string, string> = {
  hook: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  tesis: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  senal: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  resumen: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  proof: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  cierre: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30',
  stat_bombe: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  visual_bg: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30',
  timeline: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  question: 'bg-pink-500/15 text-pink-300 border-pink-500/30'
}

function renderTitle(text: string) {
  // Convention: *MOT* should appear with an accent color in the rendered visual.
  // Here we just wrap it in <span class="text-amber-300"> for preview.
  const parts = text.split(/(\*[^*]+\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <span key={i} className="text-amber-300">
          {part.slice(1, -1)}
        </span>
      )
    }
    return <span key={i}>{part}</span>
  })
}

export default function SlidePreview({ slide }: { slide: Slide }) {
  const badgeClass = AXIS_BADGE_COLORS[slide.type] ?? AXIS_BADGE_COLORS.cierre

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-mono text-zinc-500">Slide {slide.n}</span>
        <span className={`text-xs px-2 py-0.5 rounded border ${badgeClass}`}>{slide.type}</span>
      </div>

      {slide.type === 'hook' && (
        <div>
          <h3 className="text-lg font-bold leading-tight mb-2">{renderTitle(slide.title)}</h3>
          {slide.subtitle && <p className="text-sm text-zinc-400">{slide.subtitle}</p>}
        </div>
      )}

      {slide.type === 'tesis' && (
        <div>
          <h3 className="text-base font-semibold leading-snug mb-2">{renderTitle(slide.title)}</h3>
          <p className="text-sm text-zinc-400">{slide.subtitle}</p>
        </div>
      )}

      {slide.type === 'senal' && (
        <div>
          <div className="text-2xl font-mono text-amber-300 mb-2">{slide.number}</div>
          <h3 className="text-base font-semibold mb-2">{slide.title}</h3>
          <p className="text-sm text-zinc-400 mb-3">{slide.body}</p>
          {slide.question && <p className="text-sm italic text-zinc-500">{slide.question}</p>}
        </div>
      )}

      {slide.type === 'resumen' && (
        <div>
          <h3 className="text-base font-semibold mb-3">{slide.title}</h3>
          <ul className="space-y-2">
            {slide.items.map((item, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="font-mono text-amber-300 shrink-0">{item.number}</span>
                <span>
                  <span className="font-medium">{item.title}</span>
                  <span className="text-zinc-500"> — {item.subtitle}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {slide.type === 'proof' && (
        <div>
          <h3 className="text-base font-semibold mb-3">{slide.title}</h3>
          <div className="grid grid-cols-3 gap-2">
            {slide.stats.map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-xl font-bold text-amber-300">{s.value}</div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-wide mt-1">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {slide.type === 'cierre' && (
        <div>
          <h3 className="text-base font-semibold mb-2">{slide.title}</h3>
          <p className="text-sm text-zinc-400 mb-3">{slide.subtitle}</p>
          <div className="flex gap-2 text-xs">
            <span className="px-2 py-1 rounded border border-zinc-600 text-zinc-300">
              A. GUARDA ESTO
            </span>
            <span className="px-2 py-1 rounded bg-amber-500/30 text-amber-200">
              B. AUDITÁ GRATIS
            </span>
          </div>
        </div>
      )}

      {slide.type === 'stat_bombe' && (
        <div>
          <div className="text-4xl font-bold text-amber-300 mb-2">{slide.stat}</div>
          <div className="text-sm font-semibold whitespace-pre-line mb-2">{slide.label}</div>
          {slide.sub && <p className="text-xs text-zinc-500">{slide.sub}</p>}
        </div>
      )}

      {slide.type === 'visual_bg' && (
        <div>
          <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">
            bg word: <span className="font-mono text-fuchsia-300">{slide.bgWord}</span>
          </div>
          <div className="space-y-0.5">
            {slide.titleLines.split('|').map((line, i) => (
              <div
                key={i}
                className={
                  i === (slide.accentLine ?? 0)
                    ? 'text-base font-semibold text-amber-300'
                    : 'text-base font-semibold'
                }
              >
                {line}
              </div>
            ))}
          </div>
        </div>
      )}

      {slide.type === 'timeline' && (
        <div>
          <h3 className="text-sm font-semibold mb-3">
            {renderTitle(slide.title.replace(/\|/g, ' '))}
          </h3>
          <ol className="space-y-2 text-sm">
            {slide.steps.split('|').map((step, i) => {
              const [stepTitle, stepSub] = step.split('^')
              return (
                <li key={i} className="flex gap-3">
                  <span className="font-mono text-amber-300 shrink-0">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span>
                    <span className="font-medium">{stepTitle}</span>
                    {stepSub && <span className="text-zinc-500"> — {stepSub}</span>}
                  </span>
                </li>
              )
            })}
          </ol>
        </div>
      )}

      {slide.type === 'question' && (
        <div>
          <div className="space-y-0.5">
            {slide.questionLines.split('|').map((line, i) => (
              <div key={i} className="text-base font-semibold leading-tight">
                {renderTitle(line)}
              </div>
            ))}
          </div>
          {slide.sub && (
            <p className="text-sm text-zinc-400 mt-3 whitespace-pre-line">{slide.sub}</p>
          )}
        </div>
      )}
    </div>
  )
}
