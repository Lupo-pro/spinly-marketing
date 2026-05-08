import { SkeletonGrid, Skeleton } from './_components/ui/Skeleton'
import { SPINLY_BRAND } from './_styles/brand'

export default function Loading() {
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
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <Skeleton height={12} width={80} style={{ marginBottom: 12 }} />
        <Skeleton height={36} width={320} style={{ marginBottom: 24 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12, marginBottom: 20 }}>
          <Skeleton height={94} borderRadius={14} />
          <Skeleton height={94} borderRadius={14} />
        </div>
        <Skeleton height={56} borderRadius={12} style={{ marginBottom: 16 }} />
        <SkeletonGrid count={6} />
      </div>
    </main>
  )
}
