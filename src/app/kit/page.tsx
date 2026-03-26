'use client'
import { useEffect, useState } from 'react'

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

export default function KitShopPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({})
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [buyerName, setBuyerName] = useState('')
  const [buyerEmail, setBuyerEmail] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [checkingOut, setCheckingOut] = useState<string | null>(null)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/kit/products')
      const data = await res.json()
      const now = new Date()
      // Filter to products within their order window
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

  function isOrderWindowOpen(p: Product): boolean {
    const now = new Date()
    if (!p.order_window_open && !p.order_window_close) return true
    const open = p.order_window_open ? new Date(p.order_window_open) : null
    const close = p.order_window_close ? new Date(p.order_window_close) : null
    if (open && now < open) return false
    if (close && now > close) return false
    return true
  }

  function formatWindowDate(d: string) {
    return new Date(d).toLocaleDateString('en-IE', {
      day: 'numeric', month: 'short', year: 'numeric'
    })
  }

  async function handleCheckout(product: Product) {
    const size = selectedSizes[product.id]
    const quantity = quantities[product.id] ?? 1

    if (!size) { setError('Please select a size'); return }
    if (!buyerName) { setError('Please enter your name'); return }
    if (!buyerEmail) { setError('Please enter your email'); return }
    if (!deliveryAddress) { setError('Please enter your delivery address'); return }

    setError('')
    setCheckingOut(product.id)

    try {
      // Step 1 — create PayPal order
      const checkoutRes = await fetch('/api/kit/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product.id,
          size,
          quantity,
          price: product.price,
        }),
      })

      const { paypal_order_id, error: checkoutError } = await checkoutRes.json()
      if (checkoutError) throw new Error(checkoutError)

      // Step 2 — capture payment
      const captureRes = await fetch('/api/kit/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paypal_order_id,
          product_id: product.id,
          size,
          quantity,
          amount_paid: product.price * quantity,
          buyer_name: buyerName,
          buyer_email: buyerEmail,
          delivery_address: deliveryAddress,
        }),
      })

      const { error: captureError } = await captureRes.json()
      if (captureError) throw new Error(captureError)

      setSuccess(`Order placed successfully! Check ${buyerEmail} for your confirmation.`)
      setBuyerName('')
      setBuyerEmail('')
      setDeliveryAddress('')
      setSelectedSizes({})
      setQuantities({})
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong. Please try again.')
    } finally {
      setCheckingOut(null)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-ravens-dark flex items-center justify-center">
      <p className="text-ravens-muted">Loading kit...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-ravens-dark">
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-10">

        <div>
          <h1 className="text-3xl font-bold text-white">Kit Shop</h1>
          <p className="text-ravens-muted mt-2">Order your DRRC kit below.</p>
        </div>

        {success && (
          <div className="bg-green-900 border border-green-700 rounded-lg px-4 py-3 text-green-300 text-sm">
            {success}
          </div>
        )}

        {error && (
          <div className="bg-red-900 border border-red-700 rounded-lg px-4 py-3 text-red-300 text-sm">
            {error}
          </div>
        )}

        {products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-ravens-muted text-lg">No kit available right now.</p>
            <p className="text-ravens-muted text-sm mt-2">Check back soon for the next order window.</p>
          </div>
        ) : (
          <>
            {/* Products */}
            <div className="grid gap-6 sm:grid-cols-2">
              {products.map(p => (
                <div key={p.id} className="bg-ravens-surface border border-ravens-border rounded-lg overflow-hidden">
                  {/* Image placeholder */}
                  {p.images && p.images.length > 0 ? (
                    <img src={p.images[0]} alt={p.name} className="w-full h-48 object-cover" />
                  ) : (
                    <div className="w-full h-48 bg-ravens-dark flex items-center justify-center">
                      <span className="text-ravens-muted text-sm">No image</span>
                    </div>
                  )}

                  <div className="p-5 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-white font-semibold">{p.name}</h2>
                        {p.description && (
                          <p className="text-ravens-muted text-sm mt-1">{p.description}</p>
                        )}
                      </div>
                      <span className="text-white font-bold text-lg">€{p.price.toFixed(2)}</span>
                    </div>

                    {/* Order window */}
                    {p.order_window_close && (
                      <p className="text-xs text-ravens-muted">
                        Order window closes {formatWindowDate(p.order_window_close)}
                      </p>
                    )}

                    {/* Size selector */}
                    <div className="space-y-1">
                      <label className="text-xs text-ravens-muted">Size</label>
                      <div className="flex gap-2 flex-wrap">
                        {p.sizes.map(size => (
                          <button
                            key={size}
                            onClick={() => setSelectedSizes(prev => ({ ...prev, [p.id]: size }))}
                            className={`px-3 py-1 rounded text-sm border transition-colors ${
                              selectedSizes[p.id] === size
                                ? 'bg-ravens-red border-ravens-red text-white'
                                : 'border-ravens-border text-ravens-muted hover:text-white'
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Quantity */}
                    <div className="space-y-1">
                      <label className="text-xs text-ravens-muted">Quantity</label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={quantities[p.id] ?? 1}
                        onChange={e => setQuantities(prev => ({ ...prev, [p.id]: parseInt(e.target.value) }))}
                        className="w-20 p-2 rounded bg-ravens-dark border border-ravens-border text-white text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Buyer details */}
            <div className="bg-ravens-surface border border-ravens-border rounded-lg p-6 space-y-4">
              <h2 className="text-white font-semibold">Your Details</h2>
              <p className="text-ravens-muted text-sm">Fill in your details once to apply to all orders.</p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm text-ravens-muted">Full Name</label>
                  <input
                    value={buyerName}
                    onChange={e => setBuyerName(e.target.value)}
                    placeholder="Your name"
                    className="w-full p-2 rounded bg-ravens-dark border border-ravens-border text-white text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-ravens-muted">Email</label>
                  <input
                    type="email"
                    value={buyerEmail}
                    onChange={e => setBuyerEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full p-2 rounded bg-ravens-dark border border-ravens-border text-white text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm text-ravens-muted">Delivery Address</label>
                <textarea
                  value={deliveryAddress}
                  onChange={e => setDeliveryAddress(e.target.value)}
                  placeholder="Street, City, County, Eircode"
                  rows={3}
                  className="w-full p-2 rounded bg-ravens-dark border border-ravens-border text-white text-sm resize-none"
                />
              </div>
            </div>

            {/* Order buttons per product */}
            <div className="space-y-3">
              {products.map(p => (
                <div key={p.id} className="flex items-center justify-between bg-ravens-surface border border-ravens-border rounded-lg px-4 py-3">
                  <div>
                    <p className="text-white text-sm font-medium">{p.name}</p>
                    <p className="text-ravens-muted text-xs">
                      {selectedSizes[p.id] ? `Size: ${selectedSizes[p.id]}` : 'No size selected'} ·
                      Qty: {quantities[p.id] ?? 1} ·
                      Total: €{(p.price * (quantities[p.id] ?? 1)).toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCheckout(p)}
                    disabled={!isOrderWindowOpen(p) || checkingOut === p.id}
                    className="bg-ravens-red text-white px-4 py-2 rounded text-sm font-semibold disabled:opacity-50 hover:opacity-90"
                  >
                    {checkingOut === p.id ? 'Processing...' : 'Order Now'}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}