import { Archivo_Black, Manrope } from 'next/font/google'
import './_shared/styles.css'

const archivo = Archivo_Black({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-archivo',
  display: 'swap'
})

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800']
})

export const metadata = {
  title: 'IG Render',
  robots: { index: false, follow: false }
}

// Layout is a simple wrapper — Next.js requires exactly one root <html>/<body>,
// owned by app/layout.tsx. We attach the font CSS variables to a wrapper div
// (they cascade into the .slide). styles.css resets body padding/background
// so the screenshot only contains the 1080×1350 slide.
export default function RenderLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${archivo.variable} ${manrope.variable}`}>{children}</div>
}
