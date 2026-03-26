'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Series = { id: string; name: string; year: number }
type Fixture = {
  id: string
  title: string
  date: string
  venue: string
  status: string
  series_id: string
  categories: string[]
  marshals_needed: number
}

const STATUSES = ['upcoming', 'completed', 'cancelled']
const ALL_CATEGORIES = ['C1', 'C2', 'C3']

export default function AdminFixturesPage() {
  const supabase = createClient()

  const [fixtures, setFixtures] = useState<Fixture[]>([])
  const [series, setSeries] = useState<Series[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [venue, setVenue] = useState('Mondello Park')
  const [status, setStatus] = useState('upcoming')
  const [seriesId, setSeriesId] = useState('')
  const [categories, setCategories] = useState<string[]>(['C1', 'C2', 'C3'])
  const [marshalsNeeded, setMarshalsNeeded] = useState(0)

  useEffect(() => {
    async function load() {
      const [{ data: f }, { data: s }] = await Promise.all([
        supabase.from('fixtures').select('*').order('date', { ascending: false }),
        supabase.from('series').select('id, name, year').order('year', { ascending: false }),
      ])
      setFixtures(f ?? [])
      setSeries(s ?? [])
      setLoading(false)
    }
    load()
  }, [])

  function resetForm() {
    setEditingId(null)
    setTitle('')
    setDate('')
    setVenue('Mondello Park')
    setStatus('upcoming')
    setSeriesId('')
    setCategories(['C1', 'C2', 'C3'])
    setMarshalsNeeded(0)
    setError('')
    setSuccess('')
  }

  function startEdit(f: Fixture) {
    setEditingId(f.id)
    setTitle(f.title)
    setDate(f.date)
    setVenue(f.venue)
    setStatus(f.status)
    setSeriesId(f.series_id)
    setCategories(f.categories ?? ['C1', 'C2', 'C3'])
    setMarshalsNeeded(f.marshals_needed ?? 0)
    setError('')
    setSuccess('')
  }

  function toggleCategory(cat: string) {
    setCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title || !date || !seriesId) {
      setError('Title, date and series are required')
      return
    }
    setSaving(true)
    setError('')

    const payload = {
      title,
      date,
      venue,
      status,
      series_id: seriesId,
      categories,
      marshals_needed: marshalsNeeded,
    }

    const { error: err } = editingId
      ? await supabase.from('fixtures').update(payload).eq('id', editingId)
      : await supabase.from('fixtures').insert(payload)

    if (err) {
      setError(err.message)
    } else {
      setSuccess(editingId ? 'Fixture updated.' : 'Fixture created.')
      const { data } = await supabase
        .from('fixtures')
        .select('*')
        .order('date', { ascending: false })
      setFixtures(data ?? [])
      resetForm()
    }
    setSaving(false)
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-IE', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
    })
  }

  function statusColour(s: string) {
    if (s === 'upcoming') return 'text-blue-400'
    if (s === 'completed') return 'text-green-400'
    return 'text-ravens-muted'
  }

  if (loading) return <div className="p-8 text-ravens-muted">Loading...</div>

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Fixtures</h1>
        <p className="text-sm text-ravens-muted mt-1">Create and manage race fixtures.</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-ravens-surface border border-ravens-border rounded-lg p-6 space-y-4">
        <h2 className="text-base font-semibold text-white">
          {editingId ? 'Edit Fixture' : 'New Fixture'}
        </h2>

        {error && <p className="text-red-500 text-sm">{error}</p>}
        {success && <p className="text-green-500 text-sm">{success}</p>}

        <div className="space-y-1">
          <label className="text-sm text-ravens-muted">Series</label>
          <select
            value={seriesId}
            onChange={e => setSeriesId(e.target.value)}
            className="w-full p-2 rounded bg-ravens-dark border border-ravens-border text-white text-sm"
          >
            <option value="">Select a series...</option>
            {series.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.year})</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm text-ravens-muted">Title</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Round 1"
            className="w-full p-2 rounded bg-ravens-dark border border-ravens-border text-white text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm text-ravens-muted">Date</label>
            <input
              type="datetime-local"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full p-2 rounded bg-ravens-dark border border-ravens-border text-white text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-ravens-muted">Venue</label>
            <input
              value={venue}
              onChange={e => setVenue(e.target.value)}
              className="w-full p-2 rounded bg-ravens-dark border border-ravens-border text-white text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm text-ravens-muted">Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="w-full p-2 rounded bg-ravens-dark border border-ravens-border text-white text-sm"
            >
              {STATUSES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm text-ravens-muted">Marshals Needed</label>
            <input
              type="number"
              value={marshalsNeeded}
              onChange={e => setMarshalsNeeded(parseInt(e.target.value))}
              className="w-full p-2 rounded bg-ravens-dark border border-ravens-border text-white text-sm"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-ravens-muted">Categories</label>
          <div className="flex gap-3">
            {ALL_CATEGORIES.map(cat => (
              <label key={cat} className="flex items-center gap-2 cursor-pointer text-sm text-white">
                <input
                  type="checkbox"
                  checked={categories.includes(cat)}
                  onChange={() => toggleCategory(cat)}
                  className="accent-ravens-red w-4 h-4"
                />
                {cat}
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-ravens-red text-white px-4 py-2 rounded text-sm font-semibold disabled:opacity-50 hover:opacity-90"
          >
            {saving ? 'Saving...' : editingId ? 'Update Fixture' : 'Create Fixture'}
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

      {/* Fixtures list */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-white">Existing Fixtures</h2>
        {fixtures.length === 0 ? (
          <p className="text-ravens-muted text-sm">No fixtures yet.</p>
        ) : (
          <div className="space-y-2">
            {fixtures.map(f => (
              <div
                key={f.id}
                className="flex items-center justify-between bg-ravens-surface border border-ravens-border rounded-lg px-4 py-3"
              >
                <div>
                  <p className="text-white text-sm font-medium">{f.title}</p>
                  <p className="text-ravens-muted text-xs">
                    {formatDate(f.date)} · {f.venue} ·{' '}
                    <span className={statusColour(f.status)}>{f.status}</span>
                  </p>
                </div>
                <button
                  onClick={() => startEdit(f)}
                  className="text-xs text-ravens-muted hover:text-white border border-ravens-border rounded px-3 py-1"
                >
                  Edit
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}