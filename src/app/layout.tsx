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
      <body
        className="min-h-screen flex flex-col m-0"
        style={{
          background: 'linear-gradient(180deg, #000000 0%, #292450 25%, #2C2865 50%, #464775 75%, #E1E7FF 100%)',
        }}
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