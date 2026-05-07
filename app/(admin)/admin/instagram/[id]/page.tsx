import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getServerSupabase } from '@/lib/supabase/server'
import type { Slide } from '@/lib/instagram/generator'
import SlidePreview from '../_components/SlidePreview'
import RenderButton from '../_components/RenderButton'
import SlidesGrid from '../_components/SlidesGrid'
import DownloadZipButton from '../_components/DownloadZipButton'
import DownloadSinglePngButton from '../_components/DownloadSinglePngButton'
import CaptionBlock from '../_components/CaptionBlock'
import MarkPublishedButton from '../_components/MarkPublishedButton'
import PublishButton from '../_components/PublishButton'
import PublishStatusTracker from '../_components/PublishStatusTracker'
import PostActions from './_components/PostActions'
import { updatePostContent } from '../actions'
import { SPINLY_BRAND } from '../_styles/brand'

export const dynamic = 'force-dynamic'

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  approved: 'Approved',
  scheduled: 'Scheduled',
  published: 'Published',
  rejected: 'Rejected',
  failed: 'Failed'
}

const SECTION_BG = SPINLY_BRAND.bg.surface
const SECTION_BORDER = `1px solid ${SPINLY_BRAND.border.default}`

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 1.5,
        color: SPINLY_BRAND.text.secondary,
        textTransform: 'uppercase',
        margin: '0 0 12px'
      }}
    >
      {children}
    </h2>
  )
}

export default async function PostValidationPage({ params }: { params: { id: string } }) {
  const supabase = getServerSupabase()
  const { data: post } = await supabase
    .from('ig_posts')
    .select('*, ig_angles(axis, hook, thesis)')
    .eq('id', params.id)
    .single()

  if (!post) notFound()

  const slides = (post.slides_json ?? []) as Slide[]
  const hashtags = (post.hashtags ?? []) as string[]
  const hashtagsString = hashtags.join(' ')
  const angle = Array.isArray(post.ig_angles) ? post.ig_angles[0] : post.ig_angles
  const slideUrls = (post.slide_image_urls ?? []) as string[]
  const contentType = (post.content_type ?? 'carousel') as 'carousel' | 'single_post' | 'story'
  const isCarousel = contentType === 'carousel'
  const isStory = contentType === 'story'
  const expectedSlides = isCarousel ? 10 : 1
  const hasRendered = slideUrls.length === expectedSlides
  const isReadyToPublish = post.status === 'approved' && hasRendered

  const ctype = SPINLY_BRAND.contentType[contentType]
  const statusBadge =
    SPINLY_BRAND.status[post.status as keyof typeof SPINLY_BRAND.status] ??
    SPINLY_BRAND.status.draft
  const peBadge = post.pe_status
    ? SPINLY_BRAND.status[post.pe_status as keyof typeof SPINLY_BRAND.status]
    : null

  const titleLabel = isStory
    ? 'Validation story'
    : isCarousel
      ? 'Validation carrousel'
      : 'Validation post simple'
  const previewLabel = isCarousel ? '10 slides (texte)' : '1 slide (texte)'

  return (
    <main
      style={{
        background: SPINLY_BRAND.bg.base,
        minHeight: '100vh',
        padding: 24,
        fontFamily: 'var(--font-body), system-ui, -apple-system, sans-serif',
        color: SPINLY_BRAND.text.primary
      }}
    >
      <PublishStatusTracker postId={post.id} peStatus={post.pe_status ?? null} />

      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 12 }}>
          <Link
            href="/admin/instagram"
            style={{
              fontSize: 12,
              color: SPINLY_BRAND.text.secondary,
              textDecoration: 'none'
            }}
          >
            ← Content Studio
          </Link>
        </div>

        <header style={{ marginBottom: 24 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap'
            }}
          >
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 28,
                fontWeight: 900,
                letterSpacing: -0.5,
                margin: 0
              }}
            >
              {titleLabel}
            </h1>
            <Pill bg={ctype.bg} fg={ctype.fg} label={`${ctype.icon} ${ctype.label}`} />
            <Pill bg={statusBadge.bg} fg={statusBadge.fg} label={statusBadge.label} />
            {peBadge && <Pill bg={peBadge.bg} fg={peBadge.fg} label={peBadge.label} />}
          </div>
          {angle && (
            <p style={{ fontSize: 13, color: SPINLY_BRAND.text.secondary, margin: '8px 0 0' }}>
              <span style={{ fontFamily: 'monospace' }}>{angle.axis}</span> · {angle.hook}
            </p>
          )}
        </header>

        {isReadyToPublish && !post.pe_status && (
          <div
            style={{
              marginBottom: 16,
              padding: '10px 14px',
              background: 'rgba(255,255,255,0.02)',
              border: SECTION_BORDER,
              borderRadius: 10
            }}
          >
            <p style={{ margin: 0, fontSize: 13, color: SPINLY_BRAND.text.primary }}>
              ✨ Prêt à publier — utilise{' '}
              <strong>Publication automatique</strong> ci-dessous (ou télécharge le{' '}
              {isCarousel ? 'ZIP' : 'PNG'} en fallback).
            </p>
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)',
            gap: 24,
            alignItems: 'start'
          }}
        >
          {/* ───────── LEFT: PREVIEW ───────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <section
              style={{
                background: SECTION_BG,
                border: SECTION_BORDER,
                borderRadius: 14,
                padding: 18
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 14
                }}
              >
                <SectionTitle>{isCarousel ? 'Visuels rendus' : 'Visuel rendu'}</SectionTitle>
                <RenderButton postId={post.id} hasUrls={slideUrls.length > 0} />
              </div>
              <SlidesGrid urls={slideUrls} />
            </section>

            <section
              style={{
                background: SECTION_BG,
                border: SECTION_BORDER,
                borderRadius: 14,
                padding: 18
              }}
            >
              <SectionTitle>{previewLabel}</SectionTitle>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: 12
                }}
              >
                {slides.map((slide, i) => (
                  <SlidePreview key={slide.n ?? i} slide={slide} />
                ))}
              </div>
            </section>
          </div>

          {/* ───────── RIGHT: ACTIONS ───────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <section
              style={{
                background: SECTION_BG,
                border: SECTION_BORDER,
                borderRadius: 14,
                padding: 18
              }}
            >
              <SectionTitle>Actions</SectionTitle>
              <PostActions postId={post.id} status={post.status} />
            </section>

            <section
              style={{
                background: SECTION_BG,
                border: `1px solid ${SPINLY_BRAND.border.accent}`,
                borderRadius: 14,
                padding: 18
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 14,
                  gap: 8
                }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: SPINLY_BRAND.text.primary }}>
                    Publication automatique
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: SPINLY_BRAND.text.secondary,
                      marginTop: 2
                    }}
                  >
                    via PostEverywhere · IG · FB · Threads · TikTok · LinkedIn · X
                  </div>
                </div>
              </div>
              <PublishButton
                postId={post.id}
                status={post.status}
                contentType={contentType}
                hasRendered={hasRendered}
                peStatus={post.pe_status ?? null}
                peScheduledFor={post.pe_scheduled_for ?? null}
                peError={post.pe_error ?? null}
                peDestinations={post.pe_destinations ?? null}
              />
            </section>

            <PostEditForm
              postId={post.id}
              caption={post.caption}
              hashtagsString={hashtagsString}
            />

            <details
              style={{
                background: SECTION_BG,
                border: SECTION_BORDER,
                borderRadius: 14,
                padding: 18
              }}
            >
              <summary
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 1.5,
                  color: SPINLY_BRAND.text.secondary,
                  textTransform: 'uppercase',
                  cursor: 'pointer'
                }}
              >
                Publication manuelle (fallback)
              </summary>
              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <div style={{ fontSize: 12, color: SPINLY_BRAND.text.secondary, marginBottom: 8 }}>
                    1. Télécharge le fichier
                  </div>
                  {isCarousel ? (
                    <DownloadZipButton postId={post.id} hasRendered={hasRendered} />
                  ) : (
                    <DownloadSinglePngButton
                      postId={post.id}
                      url={slideUrls[0] ?? null}
                      hasRendered={hasRendered}
                    />
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 12, color: SPINLY_BRAND.text.secondary, marginBottom: 8 }}>
                    2. Copie le caption
                  </div>
                  <CaptionBlock caption={post.caption} hashtags={hashtags} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: SPINLY_BRAND.text.secondary, marginBottom: 8 }}>
                    3. Une fois publié sur Instagram
                  </div>
                  <MarkPublishedButton
                    postId={post.id}
                    status={post.status}
                    igPermalink={post.ig_permalink}
                    hasRendered={hasRendered}
                  />
                </div>
              </div>
            </details>

            {post.rejection_reason && (
              <section
                style={{
                  padding: 14,
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  background: 'rgba(239, 68, 68, 0.08)',
                  borderRadius: 12
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: '#FCA5A5', marginBottom: 4 }}>
                  Raison du rejet
                </div>
                <p style={{ fontSize: 13, color: '#FECACA', margin: 0 }}>{post.rejection_reason}</p>
              </section>
            )}
          </div>
        </div>

        <div style={{ height: 40 }} />
        <div style={{ fontSize: 12, color: STATUS_LABEL[post.status] ? SPINLY_BRAND.text.tertiary : 'transparent' }}>
          ID : {post.id.slice(0, 8)}
        </div>
      </div>
    </main>
  )
}

function Pill({ bg, fg, label }: { bg: string; fg: string; label: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        background: bg,
        color: fg,
        padding: '4px 10px',
        borderRadius: 8,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 0.5
      }}
    >
      {label}
    </span>
  )
}

function PostEditForm({
  postId,
  caption,
  hashtagsString
}: {
  postId: string
  caption: string
  hashtagsString: string
}) {
  const update = updatePostContent.bind(null, postId)
  return (
    <section
      style={{
        background: SECTION_BG,
        border: SECTION_BORDER,
        borderRadius: 14,
        padding: 18
      }}
    >
      <SectionTitle>Caption + hashtags</SectionTitle>
      <form action={update} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label
            style={{
              display: 'block',
              fontSize: 11,
              color: SPINLY_BRAND.text.secondary,
              marginBottom: 4
            }}
          >
            Caption
          </label>
          <textarea
            name="caption"
            defaultValue={caption}
            rows={8}
            style={{
              width: '100%',
              background: '#0F0F0F',
              border: `1px solid ${SPINLY_BRAND.border.default}`,
              borderRadius: 8,
              padding: '8px 10px',
              fontSize: 12,
              fontFamily: 'monospace',
              color: SPINLY_BRAND.text.primary,
              resize: 'vertical'
            }}
          />
        </div>
        <div>
          <label
            style={{
              display: 'block',
              fontSize: 11,
              color: SPINLY_BRAND.text.secondary,
              marginBottom: 4
            }}
          >
            Hashtags (séparés par espaces)
          </label>
          <textarea
            name="hashtags"
            defaultValue={hashtagsString}
            rows={3}
            style={{
              width: '100%',
              background: '#0F0F0F',
              border: `1px solid ${SPINLY_BRAND.border.default}`,
              borderRadius: 8,
              padding: '8px 10px',
              fontSize: 12,
              fontFamily: 'monospace',
              color: SPINLY_BRAND.text.primary,
              resize: 'vertical'
            }}
          />
        </div>
        <button
          type="submit"
          style={{
            background: SPINLY_BRAND.text.primary,
            color: '#0A0A0A',
            border: 'none',
            padding: '10px 14px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            alignSelf: 'flex-start'
          }}
        >
          Sauver les changements
        </button>
      </form>
    </section>
  )
}
