import { Archivo_Black, Manrope } from 'next/font/google'

const archivoBlack = Archivo_Black({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap'
})

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700'],
  display: 'swap'
})

export default function AdminInstagramLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${archivoBlack.variable} ${manrope.variable}`}
      style={{ background: '#0A0A0A', minHeight: '100vh' }}
    >
      {children}
    </div>
  )
}
