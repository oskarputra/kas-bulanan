import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'Kas Bulanan', template: '%s · Kas Bulanan' },
  description: 'Catat pengeluaran bulanan dan pantau sisa gaji sampai gajian berikutnya.',
  icons: { icon: '/icon.svg', apple: '/icon.svg' },
}

export const viewport: Viewport = { themeColor: '#F2F2F7', width: 'device-width', initialScale: 1, viewportFit: 'cover' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  )
}
