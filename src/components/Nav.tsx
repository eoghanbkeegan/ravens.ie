'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

const NAV_LINKS = [
  { href: '/fixtures', label: 'Fixtures' },
  { href: '/standings', label: 'Standings' },
  { href: '/kit', label: 'Kit' },
]

export default function Nav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 px-6 py-0 flex items-center justify-between border-b border-white/6"
      style={{
        background: 'rgba(10,10,10,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        height: '64px',
        fontFamily: 'var(--font-outfit, sans-serif)',
      }}
    >
      {/* ── Logo ── */}
      <Link href="/" className="no-underline flex items-center shrink-0">
        <div className="relative h-9 w-28 shrink-0" style={{ mixBlendMode: 'screen' }}>
          <Image
            src="/main/ravens-logo.png"
            alt="Dublin Ravens Road Club"
            fill
            className="object-contain object-left"
            priority
          />
        </div>
      </Link>

      {/* ── Desktop links ── */}
      <div className="hidden md:flex items-center gap-1">
        {NAV_LINKS.map(({ href, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className="no-underline px-4 py-2 rounded-md text-sm font-medium transition-colors"
              style={{
                color: active ? '#ffffff' : 'rgba(255,255,255,0.5)',
                background: active ? 'rgba(255,255,255,0.06)' : 'transparent',
              }}
            >
              {label}
            </Link>
          )
        })}
        <div className="w-px h-5 mx-3" style={{ background: 'rgba(255,255,255,0.1)' }} />
        <Link
          href="/login"
          className="no-underline ml-1 px-4 py-2 rounded-md text-sm font-semibold transition-all"
          style={{
            background: 'linear-gradient(135deg, #1E1A50, #2D2870)',
            color: '#ffffff',
            border: '1px solid rgba(255,255,255,0.12)',
          }}
        >
          Admin Login
        </Link>
      </div>

      {/* ── Hamburger ── */}
      <button
        onClick={() => setOpen(!open)}
        className="flex md:hidden flex-col justify-center items-center w-9 h-9 gap-1.5 bg-transparent border-none cursor-pointer rounded-md"
        style={{ background: open ? 'rgba(255,255,255,0.06)' : 'transparent' }}
        aria-label="Toggle menu"
      >
        <span className="block w-5 h-0.5 bg-white rounded transition-all origin-center"
          style={{ transform: open ? 'translateY(8px) rotate(45deg)' : 'none' }} />
        <span className="block w-5 h-0.5 bg-white rounded transition-all"
          style={{ opacity: open ? 0 : 1 }} />
        <span className="block w-5 h-0.5 bg-white rounded transition-all origin-center"
          style={{ transform: open ? 'translateY(-8px) rotate(-45deg)' : 'none' }} />
      </button>

      {/* ── Mobile menu ── */}
      {open && (
        <div
          className="absolute top-full left-0 right-0 border-b flex flex-col md:hidden"
          style={{ background: 'rgba(10,10,10,0.97)', backdropFilter: 'blur(20px)', borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <div className="px-4 py-3 flex flex-col gap-1">
            {NAV_LINKS.map(({ href, label }) => {
              const active = pathname === href || pathname.startsWith(href + '/')
              return (
                <Link key={href} href={href} onClick={() => setOpen(false)}
                  className="no-underline px-3 py-2.5 rounded-md text-sm font-medium transition-colors"
                  style={{ color: active ? '#ffffff' : 'rgba(255,255,255,0.6)', background: active ? 'rgba(255,255,255,0.06)' : 'transparent' }}>
                  {label}
                </Link>
              )
            })}
          </div>
          <div className="mx-4 my-2 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <div className="px-4 pb-4">
            <Link href="/login" onClick={() => setOpen(false)}
              className="no-underline block px-4 py-3 rounded-md text-sm font-semibold text-center"
              style={{ background: 'linear-gradient(135deg, #1E1A50, #2D2870)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.12)' }}>
              Admin Login
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}