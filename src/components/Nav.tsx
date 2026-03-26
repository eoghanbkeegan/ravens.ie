'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function Nav() {
  const [open, setOpen] = useState(false)

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      padding: '16px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: 'rgba(15, 15, 15, 0.85)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid #252525',
    }}>
      {/* Logo */}
      <Link href="/" style={{ textDecoration: 'none' }}>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
          <span style={{
            fontFamily: 'cursive',
            fontSize: 20,
            color: '#fff',
            fontWeight: 700,
          }}>Dublin Ravens</span>
          <span style={{
            fontSize: 9,
            letterSpacing: '0.2em',
            color: '#888',
            textTransform: 'uppercase',
          }}>Road Club</span>
        </div>
      </Link>

      {/* Desktop links */}
      <div style={{
        display: 'flex',
        gap: 32,
        alignItems: 'center',
      }} className="desktop-nav">
        <NavLink href="/fixtures">Fixtures</NavLink>
        <NavLink href="/standings">Standings</NavLink>
        <NavLink href="/shop">Shop</NavLink>
        <Link href="/login" style={{
          background: '#c8102e',
          color: '#fff',
          padding: '8px 20px',
          borderRadius: 6,
          fontSize: 13,
          fontWeight: 600,
          textDecoration: 'none',
        }}>Login</Link>
      </div>

      {/* Hamburger */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          display: 'none',
          flexDirection: 'column',
          gap: 5,
          padding: 4,
        }}
        className="hamburger"
      >
        {[0, 1, 2].map((i) => (
          <span key={i} style={{
            display: 'block',
            width: 24,
            height: 2,
            background: '#fff',
            borderRadius: 2,
          }} />
        ))}
      </button>

      {/* Mobile menu */}
      {open && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: '#161616',
          borderBottom: '1px solid #252525',
          padding: '16px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}>
          <NavLink href="/fixtures" onClick={() => setOpen(false)}>Fixtures</NavLink>
          <NavLink href="/standings" onClick={() => setOpen(false)}>Standings</NavLink>
          <NavLink href="/shop" onClick={() => setOpen(false)}>Shop</NavLink>
          <NavLink href="/login" onClick={() => setOpen(false)}>Login</NavLink>
        </div>
      )}
    </nav>
  )
}

function NavLink({ href, children, onClick }: {
  href: string
  children: React.ReactNode
  onClick?: () => void
}) {
  return (
    <Link href={href} onClick={onClick} style={{
      color: '#ccc',
      textDecoration: 'none',
      fontSize: 14,
      fontWeight: 500,
      letterSpacing: '0.02em',
    }}>
      {children}
    </Link>
  )
}