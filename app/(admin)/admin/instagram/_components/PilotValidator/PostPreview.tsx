import { SPINLY_BRAND } from '../../_styles/brand'
import type { PilotPost } from './types'

export function PostPreview({ post }: { post: PilotPost }) {
  const ctype = (post.content_type ?? 'carousel') as keyof typeof SPINLY_BRAND.contentType
  const meta = SPINLY_BRAND.contentType[ctype]
  const slideUrls = Array.isArray(post.slide_image_urls) ? post.slide_image_urls : []
  const firstUrl = slideUrls[0]
  const aspectRatio = ctype === 'story' ? '9 / 16' : '4 / 5'

  let hook = post.caption?.split('\n')[0] || 'Sans titre'
  try {
    const slides = (post.slides_json ?? []) as Array<{ type?: string; title?: string }>
    const first = slides[0]
    if (first?.type === 'hook' && first.title) hook = first.title
  } catch {
    // ignore
  }

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 14,
          flexWrap: 'wrap'
        }}
      >
        <span
          style={{
            background: meta.bg,
            color: meta.fg,
            padding: '4px 10px',
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 0.5
          }}
        >
          {meta.icon} {meta.label.toUpperCase()}
        </span>
        {post.ig_angles && (
          <span style={{ fontSize: 12, color: SPINLY_BRAND.text.secondary }}>
            <span style={{ fontFamily: 'monospace' }}>{post.ig_angles.axis}</span> ·{' '}
            {post.ig_angles.hook}
          </span>
        )}
      </div>

      <div
        style={{
          background: '#000',
          borderRadius: 12,
          aspectRatio,
          maxWidth: 420,
          margin: '0 auto',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {firstUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={firstUrl}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div
            style={{
              padding: 30,
              textAlign: 'center',
              color: SPINLY_BRAND.text.tertiary,
              fontSize: 13,
              lineHeight: 1.5
            }}
          >
            ⏳ Pas encore rendu
            <div style={{ fontSize: 11, marginTop: 10, color: SPINLY_BRAND.text.secondary }}>
              Le rendering se lancera automatiquement à l’approbation.
            </div>
          </div>
        )}
        {slideUrls.length > 1 && (
          <div
            style={{
              position: 'absolute',
              bottom: 10,
              right: 12,
              fontSize: 11,
              color: 'rgba(255,255,255,0.85)',
              background: 'rgba(0,0,0,0.5)',
              padding: '3px 8px',
              borderRadius: 4
            }}
          >
            1/{slideUrls.length}
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: 16,
          fontSize: 14,
          fontWeight: 600,
          lineHeight: 1.4,
          color: SPINLY_BRAND.text.primary
        }}
      >
        {hook.replace(/\*([^*]+)\*/g, '$1')}
      </div>

      {post.caption && (
        <p
          style={{
            marginTop: 12,
            fontSize: 13,
            color: SPINLY_BRAND.text.secondary,
            whiteSpace: 'pre-wrap',
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 6,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {post.caption}
        </p>
      )}
    </>
  )
}
