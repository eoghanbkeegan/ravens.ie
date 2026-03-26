'use client'

import { useState } from 'react'
import Link from 'next/link'
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
      <Link href="/" className="no-underline flex items-center gap-3">
        <div
          className="flex items-center justify-center w-8 h-8 rounded-full shrink-0"
          style={{ background: 'linear-gradient(135deg, #1E1A50, #2D2870)' }}
          aria-hidden
        >
          <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
            <path d="M12 2C9.5 2 7.5 3.5 6.5 5.5C5.5 5 4 5 3 6c1 0 1.5.5 2 1C4 8.5 4 10 5 11.5c-.5.5-1 1.5-1 2.5 0 1.5 1 2.5 2 3-.5 1-1 2-1 3h2c0-1 .5-2 1-2.5.5.5 1.5 1 2.5 1s2-.5 2.5-1c.5.5 1 1.5 1 2.5h2c0-1-.5-2-1-3 1-.5 2-1.5 2-3 0-1-.5-2-1-2.5 1-1.5 1-3 .5-4.5.5-.5 1-1 2-1-1-1-2.5-1-3.5-.5C16.5 3.5 14.5 2 12 2z" />
          </svg>
        </div>
        <div className="flex flex-col leading-none">
          <span
            className="font-bold text-white tracking-tight"
            style={{ fontSize: '1.05rem', letterSpacing: '-0.01em' }}
          >
            Dublin Ravens
          </span>
          <span
            className="uppercase text-white/40 font-medium"
            style={{ fontSize: '0.6rem', letterSpacing: '0.18em' }}
          >
            Road Club
          </span>
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
        <span
          className="block w-5 h-0.5 bg-white rounded transition-all origin-center"
          style={{ transform: open ? 'translateY(8px) rotate(45deg)' : 'none' }}
        />
        <span
          className="block w-5 h-0.5 bg-white rounded transition-all"
          style={{ opacity: open ? 0 : 1 }}
        />
        <span
          className="block w-5 h-0.5 bg-white rounded transition-all origin-center"
          style={{ transform: open ? 'translateY(-8px) rotate(-45deg)' : 'none' }}
        />
      </button>

      {/* ── Mobile menu ── */}
      {open && (
        <div
          className="absolute top-full left-0 right-0 border-b flex flex-col md:hidden"
          style={{
            background: 'rgba(10,10,10,0.97)',
            backdropFilter: 'blur(20px)',
            borderColor: 'rgba(255,255,255,0.06)',
          }}
        >
          <div className="px-4 py-3 flex flex-col gap-1">
            {NAV_LINKS.map(({ href, label }) => {
              const active = pathname === href || pathname.startsWith(href + '/')
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="no-underline px-3 py-2.5 rounded-md text-sm font-medium transition-colors"
                  style={{
                    color: active ? '#ffffff' : 'rgba(255,255,255,0.6)',
                    background: active ? 'rgba(255,255,255,0.06)' : 'transparent',
                  }}
                >
                  {label}
                </Link>
              )
            })}
          </div>
          <div className="mx-4 my-2 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <div className="px-4 pb-4">
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="no-underline block px-4 py-3 rounded-md text-sm font-semibold text-center"
              style={{
                background: 'linear-gradient(135deg, #1E1A50, #2D2870)',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.12)',
              }}
            >
              Admin Login
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}