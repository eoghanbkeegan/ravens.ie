'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/admin'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push(redirect)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0A0A0A' }}>
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div
            className="flex items-center justify-center w-12 h-12 rounded-full mb-4"
            style={{ background: 'linear-gradient(135deg, #1E1A50, #2D2870)' }}
          >
            <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7">
              <path d="M12 2C9.5 2 7.5 3.5 6.5 5.5C5.5 5 4 5 3 6c1 0 1.5.5 2 1C4 8.5 4 10 5 11.5c-.5.5-1 1.5-1 2.5 0 1.5 1 2.5 2 3-.5 1-1 2-1 3h2c0-1 .5-2 1-2.5.5.5 1.5 1 2.5 1s2-.5 2.5-1c.5.5 1 1.5 1 2.5h2c0-1-.5-2-1-3 1-.5 2-1.5 2-3 0-1-.5-2-1-2.5 1-1.5 1-3 .5-4.5.5-.5 1-1 2-1-1-1-2.5-1-3.5-.5C16.5 3.5 14.5 2 12 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Admin Login</h1>
          <p className="text-ravens-muted text-sm mt-1">Dublin Ravens Road Club</p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleLogin}
          className="rounded-xl border border-ravens-border p-6 flex flex-col gap-4"
          style={{ background: '#161616' }}
        >
          {error && (
            <div
              className="rounded-lg px-4 py-3 text-sm text-red-400 border border-red-900/50"
              style={{ background: 'rgba(200,16,46,0.08)' }}
            >
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-ravens-muted uppercase tracking-wider">
              Email
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-lg text-white text-sm outline-none transition-colors"
              style={{
                background: '#0A0A0A',
                border: '1px solid rgba(37,37,37,1)',
              }}
              onFocus={e => e.currentTarget.style.borderColor = 'rgba(139,133,208,0.5)'}
              onBlur={e => e.currentTarget.style.borderColor = 'rgba(37,37,37,1)'}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-ravens-muted uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-lg text-white text-sm outline-none transition-colors"
              style={{
                background: '#0A0A0A',
                border: '1px solid rgba(37,37,37,1)',
              }}
              onFocus={e => e.currentTarget.style.borderColor = 'rgba(139,133,208,0.5)'}
              onBlur={e => e.currentTarget.style.borderColor = 'rgba(37,37,37,1)'}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-50 cursor-pointer border-none mt-2"
            style={{ background: 'linear-gradient(135deg, #1E1A50, #2D2870)' }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-xs text-ravens-muted mt-6">
          This area is restricted to authorised club members only.
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0A0A' }}>
        <p className="text-ravens-muted text-sm">Loading…</p>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}