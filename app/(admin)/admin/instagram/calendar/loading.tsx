import { Skeleton } from '../_components/ui/Skeleton'
import { SPINLY_BRAND } from '../_styles/brand'

export default function Loading() {
  return (
    <main
      style={{
        background: SPINLY_BRAND.bg.base,
        minHeight: '100vh',
        padding: 24,
        color: SPINLY_BRAND.text.primary,
        fontFamily: 'var(--font-body), system-ui, -apple-system, sans-serif'
      }}
    >
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <Skeleton height={12} width={140} style={{ marginBottom: 12 }} />
        <Skeleton height={32} width={240} style={{ marginBottom: 24 }} />
        <div className="spinly-calendar-grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} height={220} borderRadius={12} />
          ))}
        </div>
      </div>
    </main>
  )
}
