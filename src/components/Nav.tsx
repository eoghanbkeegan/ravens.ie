'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function Nav() {
  const [open, setOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-100 px-6 py-4 flex items-center justify-between bg-ravens-dark/85 backdrop-blur-md border-b border-ravens-border">
      {/* Logo */}
      <Link href="/" className="no-underline flex flex-col leading-tight">
        <span className="font-bold text-xl text-white" style={{ fontFamily: 'cursive' }}>
          Dublin Ravens
        </span>
        <span className="text-[9px] tracking-widest text-ravens-muted uppercase">
          Road Club
        </span>
      </Link>

      {/* Desktop links */}
      <div className="hidden md:flex gap-8 items-center">
        <NavLink href="/fixtures">Fixtures</NavLink>
        <NavLink href="/standings">Standings</NavLink>
        <NavLink href="/shop">Shop</NavLink>
        <Link
          href="/login"
          className="bg-ravens-red text-white px-5 py-2 rounded-md text-sm font-semibold no-underline hover:opacity-90 transition-opacity"
        >
          Login
        </Link>
      </div>

      {/* Hamburger */}
      <button
        onClick={() => setOpen(!open)}
        className="flex md:hidden flex-col gap-1.5 bg-transparent border-none cursor-pointer p-1"
      >
        {[0, 1, 2].map((i) => (
          <span key={i} className="block w-6 h-0.5 bg-white rounded" />
        ))}
      </button>

      {/* Mobile menu */}
      {open && (
        <div className="absolute top-full left-0 right-0 bg-ravens-surface border-b border-ravens-border px-6 py-4 flex flex-col gap-4 md:hidden">
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
    <Link
      href={href}
      onClick={onClick}
      className="text-ravens-muted hover:text-white text-sm font-medium no-underline transition-colors"
    >
      {children}
    </Link>
  )
}