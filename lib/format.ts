/**
 * Stats and number formatting helpers shared by Content Studio.
 */

const COMPACT_FMT = new Intl.NumberFormat('fr-FR', {
  notation: 'compact',
  maximumFractionDigits: 1
})

const STANDARD_FMT = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 0
})

/**
 * Format an integer for display.
 *  - <10k : "1 234"
 *  - >=10k : "12,3 k"
 */
export function formatNumber(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '0'
  if (Math.abs(n) < 10000) return STANDARD_FMT.format(n)
  return COMPACT_FMT.format(n)
}

/**
 * Format an engagement-rate-style percentage (already in %, e.g. 4.32 → "4,32 %").
 */
export function formatPercent(value: number | null | undefined, fractionDigits = 2): string {
  if (value == null || Number.isNaN(value)) return '0 %'
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  }).format(value) + ' %'
}
