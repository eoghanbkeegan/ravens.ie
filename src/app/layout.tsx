import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import './globals.css'

export const metadata: Metadata = {
  title: 'Dublin Ravens Road Club',
  description: 'Race results, standings and kit shop',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ background: '#0f0f0f', margin: 0, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Nav />
        <main style={{ flex: 1, paddingTop: 65 }}>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}