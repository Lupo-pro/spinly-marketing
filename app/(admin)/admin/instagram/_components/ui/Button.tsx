'use client'

import { forwardRef, ReactNode, ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'size'> {
  children: ReactNode
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: ReactNode
}

const VARIANT_STYLES: Record<Variant, React.CSSProperties> = {
  primary: {
    background: 'var(--spinly-gradient-cta)',
    color: '#FFFFFF',
    border: 'none'
  },
  secondary: {
    background: 'var(--spinly-bg-elevated)',
    color: 'var(--spinly-fg-primary)',
    border: '1px solid var(--spinly-border-default)'
  },
  ghost: {
    background: 'transparent',
    color: 'var(--spinly-fg-muted)',
    border: '1px solid transparent'
  },
  destructive: {
    background: 'var(--spinly-error-bg)',
    color: 'var(--spinly-error)',
    border: '1px solid var(--spinly-error-border)'
  }
}

const SIZE_STYLES: Record<Size, React.CSSProperties> = {
  sm: { padding: '6px 10px', fontSize: 12, minHeight: 32 },
  md: { padding: '10px 16px', fontSize: 13, minHeight: 44 },
  lg: { padding: '14px 20px', fontSize: 14, minHeight: 52 }
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    children,
    variant = 'secondary',
    size = 'md',
    loading = false,
    icon,
    disabled,
    type = 'button',
    style,
    ...rest
  },
  ref
) {
  const isDisabled = disabled || loading
  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      {...rest}
      style={{
        ...VARIANT_STYLES[variant],
        ...SIZE_STYLES[size],
        borderRadius: 10,
        fontWeight: 600,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.5 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        transition: 'opacity 0.15s ease, background 0.15s ease',
        ...style
      }}
    >
      {loading && (
        <span aria-hidden style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>
          ⏳
        </span>
      )}
      {!loading && icon && <span aria-hidden>{icon}</span>}
      {children}
    </button>
  )
})
