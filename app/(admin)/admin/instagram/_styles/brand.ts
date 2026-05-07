// Spinly Marketing brand tokens for the admin Content Studio.
// Inline-style friendly: every leaf is a string usable in the React `style` prop.

export const SPINLY_BRAND = {
  bg: {
    base: '#0A0A0A',
    surface: 'rgba(255, 255, 255, 0.03)',
    surfaceHover: 'rgba(255, 255, 255, 0.05)',
    surfaceActive: 'rgba(255, 255, 255, 0.08)'
  },
  border: {
    default: 'rgba(255, 255, 255, 0.06)',
    hover: 'rgba(255, 255, 255, 0.12)',
    accent: 'rgba(245, 158, 44, 0.4)'
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#888888',
    tertiary: '#555555'
  },
  gradient:
    'linear-gradient(95deg, #F5C842 0%, #F59E2C 22%, #E91E63 50%, #FF4500 75%, #FFA500 100%)',
  gradientWarm: 'linear-gradient(95deg, #F59E2C 0%, #FF4500 100%)',
  status: {
    draft: { bg: 'rgba(136, 136, 136, 0.12)', fg: '#888888', label: 'Draft' },
    approved: { bg: 'rgba(74, 222, 128, 0.12)', fg: '#4ADE80', label: 'Approved' },
    rejected: { bg: 'rgba(239, 68, 68, 0.12)', fg: '#EF4444', label: 'Rejected' },
    queued: { bg: 'rgba(245, 158, 44, 0.12)', fg: '#F59E2C', label: 'En file' },
    scheduled: { bg: 'rgba(96, 165, 250, 0.12)', fg: '#60A5FA', label: 'Programmé' },
    publishing: { bg: 'rgba(245, 158, 44, 0.12)', fg: '#F59E2C', label: 'Publication…' },
    published: { bg: 'rgba(74, 222, 128, 0.12)', fg: '#4ADE80', label: '✓ Publié' },
    partial: { bg: 'rgba(245, 158, 44, 0.12)', fg: '#F59E2C', label: 'Partiel' },
    failed: { bg: 'rgba(239, 68, 68, 0.12)', fg: '#EF4444', label: 'Échec' }
  },
  contentType: {
    carousel: { bg: 'rgba(245, 158, 44, 0.15)', fg: '#F59E2C', icon: '🎴', label: 'Carrousel' },
    single_post: { bg: 'rgba(233, 30, 99, 0.15)', fg: '#E91E63', icon: '📷', label: 'Post' },
    story: { bg: 'rgba(245, 200, 66, 0.15)', fg: '#F5C842', icon: '📱', label: 'Story' }
  }
} as const

export type StatusKey = keyof typeof SPINLY_BRAND.status
export type ContentTypeKey = keyof typeof SPINLY_BRAND.contentType
