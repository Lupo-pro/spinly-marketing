import { ReactNode } from 'react'

export type StatusKind =
  | 'draft'
  | 'approved'
  | 'rejected'
  | 'queued'
  | 'scheduled'
  | 'publishing'
  | 'processing'
  | 'published'
  | 'partial'
  | 'failed'

const STATUS_CONFIG: Record<StatusKind, { label: string; fg: string; bg: string; border: string }> = {
  draft: {
    label: 'Draft',
    fg: 'var(--spinly-fg-muted)',
    bg: 'rgba(136, 136, 136, 0.12)',
    border: 'rgba(136, 136, 136, 0.30)'
  },
  approved: {
    label: 'Approved',
    fg: 'var(--spinly-success)',
    bg: 'var(--spinly-success-bg)',
    border: 'var(--spinly-success-border)'
  },
  rejected: {
    label: 'Rejeté',
    fg: 'var(--spinly-error)',
    bg: 'var(--spinly-error-bg)',
    border: 'var(--spinly-error-border)'
  },
  queued: {
    label: 'En file',
    fg: 'var(--spinly-warning)',
    bg: 'var(--spinly-warning-bg)',
    border: 'var(--spinly-warning-border)'
  },
  scheduled: {
    label: 'Programmé',
    fg: 'var(--spinly-info)',
    bg: 'var(--spinly-info-bg)',
    border: 'var(--spinly-info-border)'
  },
  publishing: {
    label: 'Publication…',
    fg: 'var(--spinly-warning)',
    bg: 'var(--spinly-warning-bg)',
    border: 'var(--spinly-warning-border)'
  },
  processing: {
    label: 'En cours',
    fg: 'var(--spinly-warning)',
    bg: 'var(--spinly-warning-bg)',
    border: 'var(--spinly-warning-border)'
  },
  published: {
    label: '✓ Publié',
    fg: 'var(--spinly-success)',
    bg: 'var(--spinly-success-bg)',
    border: 'var(--spinly-success-border)'
  },
  partial: {
    label: 'Partiel',
    fg: 'var(--spinly-warning)',
    bg: 'var(--spinly-warning-bg)',
    border: 'var(--spinly-warning-border)'
  },
  failed: {
    label: 'Échec',
    fg: 'var(--spinly-error)',
    bg: 'var(--spinly-error-bg)',
    border: 'var(--spinly-error-border)'
  }
}

interface StatusPillProps {
  status: StatusKind
  customLabel?: ReactNode
  size?: 'sm' | 'md'
}

export function StatusPill({ status, customLabel, size = 'sm' }: StatusPillProps) {
  const c = STATUS_CONFIG[status]
  const padding = size === 'sm' ? '3px 8px' : '4px 10px'
  const fontSize = size === 'sm' ? 11 : 12
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding,
        borderRadius: 6,
        fontSize,
        fontWeight: 600,
        color: c.fg,
        background: c.bg,
        border: `1px solid ${c.border}`,
        whiteSpace: 'nowrap'
      }}
    >
      {customLabel ?? c.label}
    </span>
  )
}
