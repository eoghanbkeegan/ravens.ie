'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import dynamic from 'next/dynamic'

const JerseyViewer = dynamic(() => import('@/components/JerseyViewer'), {
  ssr: false,
  loading: () => (
    <div className="w-full flex items-center justify-center" style={{ height: 500 }}>
      <p className="text-ravens-muted text-sm">Loading kit preview...</p>
    </div>
  ),
})

declare global {
  interface Window {
    paypal?: {
      Buttons: (config: Record<string, unknown>) => { render: (selector: string) => void }
    }
  }
}

type Product = {
  id: string
  name: string
  description: string | null
  price: number
  sizes: string[]
  images: string[]
  product_type: string
  order_window_open: string | null
  order_window_close: string | null
  active: boolean
}

type Selection = {
  product: Product
  size: string
  quantity: number
}

export default function KitShopPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({})
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [modalOpen, setModalOpen] = useState(false)
  const [step, setStep] = useState<'details' | 'payment'>('details')
  const [buyerName, setBuyerName] = useState('')
  const [buyerEmail, setBuyerEmail] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/kit/products')
      const data = await res.json()
      const now = new Date()
      const available = (data.products ?? []).filter((p: Product) => {
        if (!p.order_window_open && !p.order_window_close) return true
        const open = p.order_window_open ? new Date(p.order_window_open) : null
        const close = p.order_window_close ? new Date(p.order_window_close) : null
        if (open && now < open) return false
        if (close && now > close) return false
        return true
      })
      setProducts(available)
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    if (!modalOpen || step !== 'payment') return

    const existing = document.getElementById('paypal-sdk')
    if (existing) {
      renderPayPalButton()
      return
    }

    const script = document.createElement('script')
    script.id = 'paypal-sdk'
    script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&currency=EUR&disable-funding=credit,card`
    script.async = true
    script.onload = renderPayPalButton
    document.body.appendChild(script)

    return () => {
      const container = document.getElementById('paypal-button-container')
      if (container) container.innerHTML = ''
    }
  }, [modalOpen, step])

  function renderPayPalButton() {
    if (!window.paypal) return
    const container = document.getElementById('paypal-button-container')
    if (container) container.innerHTML = ''

    window.paypal.Buttons({
      createOrder: async () => {
        const res = await fetch('/api/kit/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: selectedItems.map(s => ({
              product_id: s.product.id,
              name: s.product.name,
              size: s.size,
              quantity: s.quantity,
              price: s.product.price,
            })),
            total: totalAmount,
          }),
        })
        const data = await res.json() as { paypal_order_id?: string; error?: string }
        if (data.error) throw new Error(data.error)
        return data.paypal_order_id!
      },
      onApprove: async (data: { orderID: string }) => {
        const res = await fetch('/api/kit/capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paypal_order_id: data.orderID,
            items: selectedItems.map(s => ({
              product_id: s.product.id,
              size: s.size,
              quantity: s.quantity,
              amount_paid: s.product.price * s.quantity,
            })),
            total_amount: totalAmount,
            buyer_name: buyerName,
            buyer_email: buyerEmail,
            delivery_address: deliveryAddress,
          }),
        })
        const result = await res.json() as { error?: string; order_id?: string }
        if (result.error) throw new Error(result.error)

        const params = new URLSearchParams({
          order_id: result.order_id ?? '',
          email: buyerEmail,
          name: buyerName,
          items: JSON.stringify(selectedItems.map(s => ({
            name: s.product.name,
            size: s.size,
            quantity: s.quantity,
            price: s.product.price,
          }))),
          total: totalAmount.toFixed(2),
        })
        window.location.href = `/kit/thank-you?${params.toString()}`
      },
      onError: (err: unknown) => {
        setError(err instanceof Error ? err.message : 'Payment failed. Please try again.')
      },
    }).render('#paypal-button-container')
  }

  function formatWindowDate(d: string) {
    return new Date(d).toLocaleDateString('en-IE', {
      day: 'numeric', month: 'short', year: 'numeric'
    })
  }

  const selectedItems: Selection[] = products
    .filter(p => selectedSizes[p.id])
    .map(p => ({
      product: p,
      size: selectedSizes[p.id],
      quantity: quantities[p.id] ?? 1,
    }))

  const totalAmount = selectedItems.reduce(
    (sum, s) => sum + s.product.price * s.quantity, 0
  )

  const hasSelections = selectedItems.length > 0

  function openModal() {
    if (!hasSelections) {
      setError('Please select a size for at least one item before ordering.')
      return
    }
    setError('')
    setStep('details')
    setModalOpen(true)
  }

  function handleContinueToPayment() {
    if (!buyerName) { setError('Please enter your name'); return }
    if (!buyerEmail) { setError('Please enter your email'); return }
    if (!deliveryAddress) { setError('Please enter your delivery address'); return }
    setError('')
    setStep('payment')
  }

  return (
    <div className="min-h-screen" style={{ background: '#0A0A0A' }}>

      {/* 3D Jersey Hero */}
      <div className="relative w-full" style={{ height: 500 }}>
        <JerseyViewer />
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-10 pointer-events-none">
          <h1 className="text-3xl font-bold text-white mb-1" style={{ fontFamily: 'cursive' }}>
            Dublin Ravens
          </h1>
          <p className="text-ravens-muted text-xs uppercase tracking-widest">
            Kit Shop · Drag to rotate
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-16">

        {error && !modalOpen && (
          <div className="mb-8 bg-red-900/30 border border-red-800/50 rounded-xl px-5 py-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-ravens-muted">Loading kit...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-ravens-muted text-lg">No kit available right now.</p>
            <p className="text-ravens-muted text-sm mt-2">Check back soon for the next order window.</p>
          </div>
        ) : (
          <>
            {/* Products grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-12">
              {products.map(p => (
                <div key={p.id} className="bg-ravens-surface border border-ravens-border rounded-xl overflow-hidden">
                  <div className="relative w-full h-56 bg-black">
                    {p.images && p.images.length > 0 ? (
                      <Image src={p.images[0]} alt={p.name} fill className="object-contain p-6" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-ravens-muted text-sm">No image</span>
                      </div>
                    )}
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h2 className="text-white font-semibold text-sm">{p.name}</h2>
                        {p.description && (
                          <p className="text-ravens-muted text-xs mt-1 leading-relaxed">{p.description}</p>
                        )}
                      </div>
                      <span className="text-white font-bold shrink-0">€{p.price.toFixed(2)}</span>
                    </div>
                    {p.order_window_close && (
                      <p className="text-xs text-ravens-muted">Closes {formatWindowDate(p.order_window_close)}</p>
                    )}
                    <div className="space-y-1.5">
                      <label className="text-xs text-ravens-muted">Size</label>
                      <div className="flex gap-1.5 flex-wrap">
                        {p.sizes.map(size => (
                          <button
                            key={size}
                            onClick={() => setSelectedSizes(prev => ({
                              ...prev,
                              [p.id]: prev[p.id] === size ? '' : size
                            }))}
                            className={`px-2.5 py-1 rounded text-xs font-medium border transition-all ${
                              selectedSizes[p.id] === size
                                ? 'border-indigo-500 text-white'
                                : 'border-ravens-border text-ravens-muted hover:text-white hover:border-white/30'
                            }`}
                            style={selectedSizes[p.id] === size ? {
                              background: 'linear-gradient(135deg, #1E1A50, #2D2870)'
                            } : {}}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="text-xs text-ravens-muted">Qty</label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setQuantities(prev => ({ ...prev, [p.id]: Math.max(1, (prev[p.id] ?? 1) - 1) }))}
                          className="w-7 h-7 rounded border border-ravens-border text-ravens-muted hover:text-white text-sm flex items-center justify-center transition-colors"
                        >−</button>
                        <span className="text-white text-sm w-4 text-center">{quantities[p.id] ?? 1}</span>
                        <button
                          onClick={() => setQuantities(prev => ({ ...prev, [p.id]: Math.min(10, (prev[p.id] ?? 1) + 1) }))}
                          className="w-7 h-7 rounded border border-ravens-border text-ravens-muted hover:text-white text-sm flex items-center justify-center transition-colors"
                        >+</button>
                      </div>
                      {selectedSizes[p.id] && (
                        <span className="text-xs text-ravens-muted ml-auto">
                          €{(p.price * (quantities[p.id] ?? 1)).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Sticky order bar */}
            <div
              className="sticky bottom-6 rounded-xl border px-6 py-4 flex items-center justify-between gap-4 flex-wrap"
              style={{
                background: 'rgba(22,22,22,0.95)',
                backdropFilter: 'blur(12px)',
                borderColor: hasSelections ? 'rgba(139,133,208,0.3)' : 'rgba(37,37,37,1)',
              }}
            >
              <div>
                {hasSelections ? (
                  <>
                    <p className="text-white font-semibold">
                      {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
                    </p>
                    <p className="text-ravens-muted text-sm">
                      {selectedItems.map(s => `${s.product.name} (${s.size})`).join(', ')}
                    </p>
                  </>
                ) : (
                  <p className="text-ravens-muted text-sm">Select sizes above to place an order</p>
                )}
              </div>
              <div className="flex items-center gap-4">
                {hasSelections && (
                  <span className="text-white font-bold text-lg">€{totalAmount.toFixed(2)}</span>
                )}
                <button
                  onClick={openModal}
                  disabled={!hasSelections}
                  className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: hasSelections ? 'linear-gradient(135deg, #1E1A50, #2D2870)' : 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.12)',
                  }}
                >
                  Place Order →
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-ravens-border overflow-y-auto max-h-[90vh]"
            style={{ background: '#161616' }}
          >
            <div className="p-6 border-b border-ravens-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-white font-bold text-lg">
                  {step === 'details' ? 'Your Details' : 'Confirm & Pay'}
                </h2>
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full transition-colors ${step === 'details' ? 'bg-indigo-400' : 'bg-white/20'}`} />
                  <div className={`w-2 h-2 rounded-full transition-colors ${step === 'payment' ? 'bg-indigo-400' : 'bg-white/20'}`} />
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-ravens-muted hover:text-white text-xl leading-none bg-transparent border-none cursor-pointer"
              >✕</button>
            </div>

            <div className="p-6 space-y-6">
              {/* Order summary — always visible */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-ravens-muted mb-3">
                  Your Selection
                </h3>
                <div className="space-y-2">
                  {selectedItems.map(s => (
                    <div key={s.product.id} className="flex items-center justify-between py-2 border-b border-ravens-border last:border-0">
                      <div>
                        <p className="text-white text-sm font-medium">{s.product.name}</p>
                        <p className="text-ravens-muted text-xs">Size: {s.size} · Qty: {s.quantity}</p>
                      </div>
                      <span className="text-white text-sm font-semibold">
                        €{(s.product.price * s.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-3">
                    <span className="text-white font-bold">Total</span>
                    <span className="text-white font-bold text-lg">€{totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Step 1 — Details form */}
              {step === 'details' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-ravens-muted">Full Name</label>
                      <input
                        value={buyerName}
                        onChange={e => setBuyerName(e.target.value)}
                        placeholder="Your name"
                        className="w-full px-3 py-2 rounded-lg text-white text-sm outline-none"
                        style={{ background: '#0A0A0A', border: '1px solid rgba(37,37,37,1)' }}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-ravens-muted">Email</label>
                      <input
                        type="email"
                        value={buyerEmail}
                        onChange={e => setBuyerEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full px-3 py-2 rounded-lg text-white text-sm outline-none"
                        style={{ background: '#0A0A0A', border: '1px solid rgba(37,37,37,1)' }}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-ravens-muted">Delivery Address</label>
                    <textarea
                      value={deliveryAddress}
                      onChange={e => setDeliveryAddress(e.target.value)}
                      placeholder="Street, City, County, Eircode"
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg text-white text-sm outline-none resize-none"
                      style={{ background: '#0A0A0A', border: '1px solid rgba(37,37,37,1)' }}
                    />
                  </div>

                  {error && (
                    <div className="bg-red-900/30 border border-red-800/50 rounded-lg px-4 py-3 text-red-400 text-sm">
                      {error}
                    </div>
                  )}

                  <button
                    onClick={handleContinueToPayment}
                    className="w-full py-3 rounded-lg text-sm font-semibold text-white transition-opacity border-none cursor-pointer"
                    style={{ background: 'linear-gradient(135deg, #1E1A50, #2D2870)' }}
                  >
                    Continue to Payment →
                  </button>
                </div>
              )}

              {/* Step 2 — PayPal button */}
              {step === 'payment' && (
                <div className="space-y-4">
                  <button
                    onClick={() => { setStep('details'); setError('') }}
                    className="text-ravens-muted text-sm hover:text-white transition-colors bg-transparent border-none cursor-pointer flex items-center gap-1"
                  >
                    ← Back to details
                  </button>

                  {error && (
                    <div className="bg-red-900/30 border border-red-800/50 rounded-lg px-4 py-3 text-red-400 text-sm">
                      {error}
                    </div>
                  )}

                  <div id="paypal-button-container" className="w-full min-h-[50px]" />

                  <p className="text-center text-xs text-ravens-muted">
                    Payment processed securely via PayPal. Orders are made to order.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}