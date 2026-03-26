import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import './globals.css'

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Dublin Ravens Road Club',
  description: 'Race results, standings and kit shop for Dublin Ravens Road Club.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={outfit.variable}>
      <body
        className="min-h-screen flex flex-col m-0 antialiased"
        style={{ background: '#0A0A0A', color: '#ffffff', fontFamily: 'var(--font-outfit, sans-serif)' }}
      >
        <Nav />
        <main className="flex-1 pt-16">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}