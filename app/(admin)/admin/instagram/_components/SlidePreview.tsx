import type { Slide } from '@/lib/instagram/generator'

const AXIS_BADGE_COLORS: Record<string, string> = {
  hook: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  tesis: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  senal: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  resumen: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  proof: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  cierre: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30'
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
          <div className="flex flex-col gap-1 text-sm">
            <span className="text-amber-300">→ {slide.cta_primary}</span>
            {slide.cta_secondary && (
              <span className="text-zinc-500">→ {slide.cta_secondary}</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
