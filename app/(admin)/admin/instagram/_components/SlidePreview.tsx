import type { Slide } from '@/lib/instagram/generator'
import { SPINLY_BRAND } from '../_styles/brand'

const AXIS_BADGE_COLORS: Record<string, { bg: string; fg: string }> = {
  hook: { bg: 'rgba(239, 68, 68, 0.15)', fg: '#FCA5A5' },
  tesis: { bg: 'rgba(245, 158, 44, 0.15)', fg: '#F59E2C' },
  senal: { bg: 'rgba(96, 165, 250, 0.15)', fg: '#60A5FA' },
  resumen: { bg: 'rgba(167, 139, 250, 0.15)', fg: '#C4B5FD' },
  proof: { bg: 'rgba(74, 222, 128, 0.15)', fg: '#4ADE80' },
  cierre: { bg: 'rgba(136, 136, 136, 0.15)', fg: '#A1A1AA' },
  stat_bombe: { bg: 'rgba(255, 69, 0, 0.15)', fg: '#FF8C5A' },
  visual_bg: { bg: 'rgba(233, 30, 99, 0.15)', fg: '#F472B6' },
  timeline: { bg: 'rgba(34, 211, 238, 0.15)', fg: '#22D3EE' },
  question: { bg: 'rgba(244, 114, 182, 0.15)', fg: '#F9A8D4' },
  story_stat: { bg: 'rgba(255, 69, 0, 0.15)', fg: '#FF8C5A' },
  story_question: { bg: 'rgba(244, 114, 182, 0.15)', fg: '#F9A8D4' },
  story_teaser: { bg: 'rgba(168, 85, 247, 0.15)', fg: '#C084FC' }
}

const ACCENT = SPINLY_BRAND.contentType.carousel.fg // #F59E2C — "amber-300" replacement

function renderTitle(text: string) {
  // Convention: *MOT* should appear with an accent color in the rendered visual.
  const parts = text.split(/(\*[^*]+\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <span key={i} style={{ color: ACCENT }}>
          {part.slice(1, -1)}
        </span>
      )
    }
    return <span key={i}>{part}</span>
  })
}

export default function SlidePreview({ slide }: { slide: Slide }) {
  const badge = AXIS_BADGE_COLORS[slide.type] ?? AXIS_BADGE_COLORS.cierre

  const containerStyle: React.CSSProperties = {
    background: SPINLY_BRAND.bg.surface,
    border: `1px solid ${SPINLY_BRAND.border.default}`,
    borderRadius: 12,
    padding: 20,
    color: SPINLY_BRAND.text.primary
  }

  const muted = SPINLY_BRAND.text.secondary
  const faded = SPINLY_BRAND.text.tertiary

  return (
    <div style={containerStyle}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontFamily: 'ui-monospace, monospace',
            color: faded
          }}
        >
          Slide {slide.n}
        </span>
        <span
          style={{
            fontSize: 11,
            padding: '2px 8px',
            borderRadius: 6,
            background: badge.bg,
            color: badge.fg,
            border: `1px solid ${badge.fg}40`
          }}
        >
          {slide.type}
        </span>
      </div>

      {slide.type === 'hook' && (
        <div>
          <h3
            style={{
              fontSize: 18,
              fontWeight: 700,
              lineHeight: 1.2,
              margin: 0,
              marginBottom: 8
            }}
          >
            {renderTitle(slide.title)}
          </h3>
          {slide.subtitle && (
            <p style={{ fontSize: 13, color: muted, margin: 0 }}>{slide.subtitle}</p>
          )}
        </div>
      )}

      {slide.type === 'tesis' && (
        <div>
          <h3
            style={{
              fontSize: 16,
              fontWeight: 600,
              lineHeight: 1.35,
              margin: 0,
              marginBottom: 8
            }}
          >
            {renderTitle(slide.title)}
          </h3>
          <p style={{ fontSize: 13, color: muted, margin: 0 }}>{slide.subtitle}</p>
        </div>
      )}

      {slide.type === 'senal' && (
        <div>
          <div
            style={{
              fontSize: 24,
              fontFamily: 'ui-monospace, monospace',
              color: ACCENT,
              marginBottom: 8
            }}
          >
            {slide.number}
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, marginBottom: 8 }}>
            {slide.title}
          </h3>
          <p style={{ fontSize: 13, color: muted, margin: 0, marginBottom: 12 }}>{slide.body}</p>
          {slide.question && (
            <p style={{ fontSize: 13, fontStyle: 'italic', color: faded, margin: 0 }}>
              {slide.question}
            </p>
          )}
        </div>
      )}

      {slide.type === 'resumen' && (
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, marginBottom: 12 }}>
            {slide.title}
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
            {slide.items.map((item, i) => (
              <li key={i} style={{ display: 'flex', gap: 12, fontSize: 13 }}>
                <span
                  style={{
                    fontFamily: 'ui-monospace, monospace',
                    color: ACCENT,
                    flexShrink: 0
                  }}
                >
                  {item.number}
                </span>
                <span>
                  <span style={{ fontWeight: 500 }}>{item.title}</span>
                  <span style={{ color: faded }}> — {item.subtitle}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {slide.type === 'proof' && (
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, marginBottom: 12 }}>
            {slide.title}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {slide.stats.map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: ACCENT }}>{s.value}</div>
                <div
                  style={{
                    fontSize: 10,
                    color: faded,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    marginTop: 4
                  }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {slide.type === 'cierre' && (
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, marginBottom: 8 }}>
            {slide.title}
          </h3>
          <p style={{ fontSize: 13, color: muted, margin: 0, marginBottom: 12 }}>
            {slide.subtitle}
          </p>
          <div style={{ display: 'flex', gap: 8, fontSize: 12 }}>
            <span
              style={{
                padding: '4px 8px',
                borderRadius: 6,
                border: `1px solid ${SPINLY_BRAND.border.hover}`,
                color: SPINLY_BRAND.text.primary
              }}
            >
              A. GUARDA ESTO
            </span>
            <span
              style={{
                padding: '4px 8px',
                borderRadius: 6,
                background: 'rgba(245, 158, 44, 0.3)',
                color: ACCENT
              }}
            >
              B. AUDITÁ GRATIS
            </span>
          </div>
        </div>
      )}

      {slide.type === 'stat_bombe' && (
        <div>
          <div style={{ fontSize: 36, fontWeight: 700, color: ACCENT, marginBottom: 8 }}>
            {slide.stat}
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              whiteSpace: 'pre-line',
              marginBottom: 8
            }}
          >
            {slide.label}
          </div>
          {slide.sub && <p style={{ fontSize: 11, color: faded, margin: 0 }}>{slide.sub}</p>}
        </div>
      )}

      {slide.type === 'visual_bg' && (
        <div>
          <div
            style={{
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: 1,
              color: faded,
              marginBottom: 8
            }}
          >
            bg word:{' '}
            <span
              style={{
                fontFamily: 'ui-monospace, monospace',
                color: AXIS_BADGE_COLORS.visual_bg.fg
              }}
            >
              {slide.bgWord}
            </span>
          </div>
          <div style={{ display: 'grid', gap: 2 }}>
            {slide.titleLines.split('|').map((line, i) => (
              <div
                key={i}
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: i === (slide.accentLine ?? 0) ? ACCENT : SPINLY_BRAND.text.primary
                }}
              >
                {line}
              </div>
            ))}
          </div>
        </div>
      )}

      {slide.type === 'timeline' && (
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, marginBottom: 12 }}>
            {renderTitle(slide.title.replace(/\|/g, ' '))}
          </h3>
          <ol
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'grid',
              gap: 8,
              fontSize: 13
            }}
          >
            {slide.steps.split('|').map((step, i) => {
              const [stepTitle, stepSub] = step.split('^')
              return (
                <li key={i} style={{ display: 'flex', gap: 12 }}>
                  <span
                    style={{
                      fontFamily: 'ui-monospace, monospace',
                      color: ACCENT,
                      flexShrink: 0
                    }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span>
                    <span style={{ fontWeight: 500 }}>{stepTitle}</span>
                    {stepSub && <span style={{ color: faded }}> — {stepSub}</span>}
                  </span>
                </li>
              )
            })}
          </ol>
        </div>
      )}

      {slide.type === 'question' && (
        <div>
          <div style={{ display: 'grid', gap: 2 }}>
            {slide.questionLines.split('|').map((line, i) => (
              <div key={i} style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.2 }}>
                {renderTitle(line)}
              </div>
            ))}
          </div>
          {slide.sub && (
            <p
              style={{
                fontSize: 13,
                color: muted,
                marginTop: 12,
                whiteSpace: 'pre-line',
                margin: '12px 0 0 0'
              }}
            >
              {slide.sub}
            </p>
          )}
        </div>
      )}

      {slide.type === 'story_stat' && (
        <div>
          <div style={{ fontSize: 36, fontWeight: 700, color: ACCENT, marginBottom: 8 }}>
            {slide.stat}
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              whiteSpace: 'pre-line',
              marginBottom: 8
            }}
          >
            {slide.label}
          </div>
          {slide.sub && (
            <p style={{ fontSize: 11, color: faded, margin: 0, marginBottom: 8 }}>{slide.sub}</p>
          )}
          <div
            style={{
              fontSize: 11,
              color: muted,
              marginTop: 12,
              padding: '4px 8px',
              borderRadius: 4,
              background: 'rgba(255, 69, 0, 0.2)',
              display: 'inline-block'
            }}
          >
            CTA: {slide.cta || 'audita gratis'} → {slide.ctaUrl || 'spinly.lat/audit'}
          </div>
        </div>
      )}

      {slide.type === 'story_question' && (
        <div>
          <div style={{ display: 'grid', gap: 2, marginBottom: 12 }}>
            {slide.questionLines.split('|').map((line, i) => (
              <div key={i} style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.2 }}>
                {renderTitle(line)}
              </div>
            ))}
          </div>
          {slide.sub && (
            <p
              style={{
                fontSize: 13,
                color: muted,
                marginBottom: 12,
                whiteSpace: 'pre-line',
                margin: '0 0 12px 0'
              }}
            >
              {slide.sub}
            </p>
          )}
          <div
            style={{
              fontSize: 11,
              color: muted,
              padding: '4px 8px',
              borderRadius: 4,
              background: 'rgba(255, 69, 0, 0.2)',
              display: 'inline-block'
            }}
          >
            CTA: {slide.cta || 'audita gratis'} → {slide.ctaUrl || 'spinly.lat/audit'}
          </div>
        </div>
      )}

      {slide.type === 'story_teaser' && (
        <div>
          <div
            style={{
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: 1,
              color: AXIS_BADGE_COLORS.story_teaser.fg,
              marginBottom: 8
            }}
          >
            🏷 Nuevo post
          </div>
          <div style={{ display: 'grid', gap: 2 }}>
            {slide.title.split('|').map((line, i) => (
              <div key={i} style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.2 }}>
                {renderTitle(line)}
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11, color: faded, marginTop: 12, margin: '12px 0 0 0' }}>
            ↓ {slide.teaserText || 'El post completo en mi feed.'}
          </p>
        </div>
      )}
    </div>
  )
}
