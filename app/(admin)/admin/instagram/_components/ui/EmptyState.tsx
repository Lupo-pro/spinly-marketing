import { ReactNode } from 'react'
import Link from 'next/link'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: ReactNode
  cta?: { label: string; onClick?: () => void; href?: string }
}

export function EmptyState({ icon, title, description, cta }: EmptyStateProps) {
  const ctaStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px 18px',
    background: 'var(--spinly-bg-elevated-hover)',
    border: '1px solid var(--spinly-border-default)',
    borderRadius: 10,
    color: 'var(--spinly-fg-primary)',
    fontSize: 13,
    fontWeight: 500,
    textDecoration: 'none',
    cursor: 'pointer',
    minHeight: 44
  }

  return (
    <div
      style={{
        padding: '48px 24px',
        textAlign: 'center',
        background: 'var(--spinly-bg-elevated)',
        border: '1px dashed var(--spinly-border-default)',
        borderRadius: 14
      }}
    >
      {icon && (
        <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.6 }} aria-hidden>
          {icon}
        </div>
      )}
      <h3
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: 'var(--spinly-fg-primary)',
          margin: 0,
          marginBottom: description ? 8 : cta ? 20 : 0
        }}
      >
        {title}
      </h3>
      {description && (
        <p
          style={{
            fontSize: 13,
            color: 'var(--spinly-fg-muted)',
            margin: 0,
            marginBottom: cta ? 20 : 0,
            maxWidth: 420,
            marginLeft: 'auto',
            marginRight: 'auto',
            lineHeight: 1.5
          }}
        >
          {description}
        </p>
      )}
      {cta &&
        (cta.href ? (
          <Link href={cta.href} style={ctaStyle}>
            {cta.label}
          </Link>
        ) : (
          <button type="button" onClick={cta.onClick} style={{ ...ctaStyle, border: '1px solid var(--spinly-border-default)' }}>
            {cta.label}
          </button>
        ))}
    </div>
  )
}
