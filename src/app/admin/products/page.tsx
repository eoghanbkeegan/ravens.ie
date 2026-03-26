'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Product = {
  id: string
  name: string
  description: string | null
  price: number
  sizes: string[]
  product_type: string
  order_window_open: string | null
  order_window_close: string | null
  active: boolean
}

const DEFAULT_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL']
const PRODUCT_TYPES = ['preorder', 'instock']

export default function AdminProductsPage() {
  const supabase = createClient()

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [sizes, setSizes] = useState<string[]>(DEFAULT_SIZES)
  const [productType, setProductType] = useState('preorder')
  const [orderWindowOpen, setOrderWindowOpen] = useState('')
  const [orderWindowClose, setOrderWindowClose] = useState('')
  const [active, setActive] = useState(true)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('kit_products')
        .select('*')
        .order('created_at', { ascending: false })
      setProducts(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  function resetForm() {
    setEditingId(null)
    setName('')
    setDescription('')
    setPrice('')
    setSizes(DEFAULT_SIZES)
    setProductType('preorder')
    setOrderWindowOpen('')
    setOrderWindowClose('')
    setActive(true)
    setError('')
    setSuccess('')
  }

  function startEdit(p: Product) {
    setEditingId(p.id)
    setName(p.name)
    setDescription(p.description ?? '')
    setPrice(p.price.toString())
    setSizes(p.sizes ?? DEFAULT_SIZES)
    setProductType(p.product_type)
    setOrderWindowOpen(p.order_window_open ?? '')
    setOrderWindowClose(p.order_window_close ?? '')
    setActive(p.active)
    setError('')
    setSuccess('')
  }

  function toggleSize(size: string) {
    setSizes(prev =>
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !price) {
      setError('Name and price are required')
      return
    }
    const parsedPrice = parseFloat(price)
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setError('Price must be a positive number')
      return
    }
    setSaving(true)
    setError('')

    const payload = {
      name,
      description: description || null,
      price: parsedPrice,
      sizes,
      product_type: productType,
      order_window_open: orderWindowOpen || null,
      order_window_close: orderWindowClose || null,
      active,
    }

    const { error: err } = editingId
      ? await supabase.from('kit_products').update(payload).eq('id', editingId)
      : await supabase.from('kit_products').insert(payload)

    if (err) {
      setError(err.message)
    } else {
      setSuccess(editingId ? 'Product updated.' : 'Product created.')
      const { data } = await supabase
        .from('kit_products')
        .select('*')
        .order('created_at', { ascending: false })
      setProducts(data ?? [])
      resetForm()
    }
    setSaving(false)
  }

  async function toggleActive(p: Product) {
    await supabase
      .from('kit_products')
      .update({ active: !p.active })
      .eq('id', p.id)
    setProducts(prev =>
      prev.map(x => x.id === p.id ? { ...x, active: !x.active } : x)
    )
  }

  if (loading) return <div className="p-8 text-ravens-muted">Loading...</div>

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Kit Products</h1>
        <p className="text-sm text-ravens-muted mt-1">Create and manage kit items for sale.</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-ravens-surface border border-ravens-border rounded-lg p-6 space-y-4">
        <h2 className="text-base font-semibold text-white">
          {editingId ? 'Edit Product' : 'New Product'}
        </h2>

        {error && <p className="text-red-500 text-sm">{error}</p>}
        {success && <p className="text-green-500 text-sm">{success}</p>}

        <div className="space-y-1">
          <label className="text-sm text-ravens-muted">Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. DRRC Jersey 2026"
            className="w-full p-2 rounded bg-ravens-dark border border-ravens-border text-white text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-ravens-muted">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Optional description"
            rows={3}
            className="w-full p-2 rounded bg-ravens-dark border border-ravens-border text-white text-sm resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm text-ravens-muted">Price (€)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={e => setPrice(e.target.value)}
              placeholder="85.00"
              className="w-full p-2 rounded bg-ravens-dark border border-ravens-border text-white text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-ravens-muted">Type</label>
            <select
              value={productType}
              onChange={e => setProductType(e.target.value)}
              className="w-full p-2 rounded bg-ravens-dark border border-ravens-border text-white text-sm"
            >
              {PRODUCT_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-ravens-muted">Available Sizes</label>
          <div className="flex gap-3 flex-wrap">
            {DEFAULT_SIZES.map(size => (
              <label key={size} className="flex items-center gap-2 cursor-pointer text-sm text-white">
                <input
                  type="checkbox"
                  checked={sizes.includes(size)}
                  onChange={() => toggleSize(size)}
                  className="accent-ravens-red w-4 h-4"
                />
                {size}
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm text-ravens-muted">Order Window Opens</label>
            <input
              type="datetime-local"
              value={orderWindowOpen}
              onChange={e => setOrderWindowOpen(e.target.value)}
              className="w-full p-2 rounded bg-ravens-dark border border-ravens-border text-white text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-ravens-muted">Order Window Closes</label>
            <input
              type="datetime-local"
              value={orderWindowClose}
              onChange={e => setOrderWindowClose(e.target.value)}
              className="w-full p-2 rounded bg-ravens-dark border border-ravens-border text-white text-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="active"
            checked={active}
            onChange={e => setActive(e.target.checked)}
            className="accent-ravens-red w-4 h-4"
          />
          <label htmlFor="active" className="text-sm text-white cursor-pointer">
            Active (visible in shop)
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-ravens-red text-white px-4 py-2 rounded text-sm font-semibold disabled:opacity-50 hover:opacity-90"
          >
            {saving ? 'Saving...' : editingId ? 'Update Product' : 'Create Product'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="text-ravens-muted text-sm px-4 py-2 rounded border border-ravens-border hover:text-white"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Products list */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-white">Existing Products</h2>
        {products.length === 0 ? (
          <p className="text-ravens-muted text-sm">No products yet.</p>
        ) : (
          <div className="space-y-2">
            {products.map(p => (
              <div
                key={p.id}
                className="flex items-center justify-between bg-ravens-surface border border-ravens-border rounded-lg px-4 py-3"
              >
                <div>
                  <p className="text-white text-sm font-medium">{p.name}</p>
                  <p className="text-ravens-muted text-xs">
                    €{p.price.toFixed(2)} · {p.product_type} ·{' '}
                    <span className={p.active ? 'text-green-400' : 'text-ravens-muted'}>
                      {p.active ? 'active' : 'hidden'}
                    </span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleActive(p)}
                    className="text-xs text-ravens-muted hover:text-white border border-ravens-border rounded px-3 py-1"
                  >
                    {p.active ? 'Hide' : 'Show'}
                  </button>
                  <button
                    onClick={() => startEdit(p)}
                    className="text-xs text-ravens-muted hover:text-white border border-ravens-border rounded px-3 py-1"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}