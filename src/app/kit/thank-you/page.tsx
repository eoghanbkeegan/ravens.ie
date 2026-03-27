'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'

type OrderItem = {
  name: string
  size: string
  quantity: number
  price: number
}

function ThankYouContent() {
  const params = useSearchParams()
  const name = params.get('name') ?? 'there'
  const email = params.get('email') ?? ''
  const total = params.get('total') ?? '0.00'
  const orderId = params.get('order_id') ?? ''

  let items: OrderItem[] = []
  try {
    items = JSON.parse(params.get('items') ?? '[]')
  } catch {
    items = []
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 py-16"
      style={{ background: '#0A0A0A' }}
    >
      <div className="max-w-lg w-full">

        {/* Success icon */}
        <div className="flex justify-center mb-8">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-3xl text-white font-bold"
            style={{ background: 'linear-gradient(135deg, #1E1A50, #2D2870)' }}
          >
            ✓
          </div>
        </div>

        {/* Heading */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white mb-3">
            Thanks, {name}! 🎉
          </h1>
          <p className="text-ravens-muted">
            Your payment was successful. A receipt has been sent to{' '}
            <span className="text-white">{email}</span>.
          </p>
          {orderId && (
            <p className="text-ravens-muted text-xs mt-2">
              Order ID: <span className="font-mono text-white">{orderId}</span>
            </p>
          )}
        </div>

        {/* Order summary */}
        {items.length > 0 && (
          <div
            className="rounded-xl border border-ravens-border p-6 mb-6"
            style={{ background: '#161616' }}
          >
            <h2 className="text-xs font-semibold uppercase tracking-widest text-ravens-muted mb-4">
              Order Summary
            </h2>
            <div className="space-y-3">
              {items.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-medium">{item.name}</p>
                    <p className="text-ravens-muted text-xs">
                      Size: {item.size} · Qty: {item.quantity}
                    </p>
                  </div>
                  <span className="text-white text-sm font-semibold">
                    €{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
              <div className="border-t border-ravens-border pt-3 flex items-center justify-between">
                <span className="text-white font-bold">Total paid</span>
                <span className="text-white font-bold text-lg">€{total}</span>
              </div>
            </div>
          </div>
        )}

        {/* Delivery notice */}
        <div
          className="rounded-xl border p-5 mb-8"
          style={{
            background: 'rgba(30,26,80,0.3)',
            borderColor: 'rgba(139,133,208,0.3)',
          }}
        >
          <div className="flex gap-3">
            <span className="text-2xl shrink-0">📦</span>
            <div>
              <h3 className="text-white font-semibold text-sm mb-1">
                About your delivery
              </h3>
              <p className="text-ravens-muted text-sm leading-relaxed">
                Dublin Ravens kit is <strong className="text-white">made to order</strong> — 
                orders are placed with our kit supplier, GOBIK,{' '}
                <strong className="text-white">twice a year</strong> (typically April and September).
                Your kit will be dispatched after the next batch order closes.
                You&apos;ll receive an email update when your order ships.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-center flex-wrap">
          <Link
            href="/fixtures"
            className="px-6 py-3 rounded-lg text-sm font-semibold text-white no-underline border border-ravens-border hover:border-white/30 transition-colors"
          >
            View Fixtures
          </Link>
          <Link
            href="/"
            className="px-6 py-3 rounded-lg text-sm font-semibold text-white no-underline transition-all"
            style={{ background: 'linear-gradient(135deg, #1E1A50, #2D2870)' }}
          >
            Back to Home →
          </Link>
        </div>

      </div>
    </div>
  )
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#0A0A0A' }}
      >
        <p className="text-ravens-muted">Loading...</p>
      </div>
    }>
      <ThankYouContent />
    </Suspense>
  )
}