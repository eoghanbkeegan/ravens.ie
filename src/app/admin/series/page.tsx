'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

type ScoringTemplate = { id: string; name: string }
type Series = { id: string; name: string; year: number; scoring_template_id: string }

export default function AdminSeriesPage() {
 const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

  const [series, setSeries] = useState<Series[]>([])
  const [templates, setTemplates] = useState<ScoringTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [year, setYear] = useState(new Date().getFullYear())
  const [templateId, setTemplateId] = useState('')

  useEffect(() => {
    async function load() {
      const [{ data: s }, { data: t }] = await Promise.all([
        supabase.from('series').select('*').order('year', { ascending: false }),
        supabase.from('scoring_templates').select('id, name').order('name'),
      ])
      setSeries(s ?? [])
      setTemplates(t ?? [])
      setLoading(false)
    }
    load()
  }, [])

  function resetForm() {
    setEditingId(null)
    setName('')
    setYear(new Date().getFullYear())
    setTemplateId('')
    setError('')
    setSuccess('')
  }

  function startEdit(s: Series) {
    setEditingId(s.id)
    setName(s.name)
    setYear(s.year)
    setTemplateId(s.scoring_template_id)
    setError('')
    setSuccess('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !year || !templateId) {
      setError('All fields are required')
      return
    }
    setSaving(true)
    setError('')

    const payload = { name, year, scoring_template_id: templateId }

    const { error: err } = editingId
      ? await supabase.from('series').update(payload).eq('id', editingId)
      : await supabase.from('series').insert(payload)

    if (err) {
      setError(err.message)
    } else {
      setSuccess(editingId ? 'Series updated.' : 'Series created.')
      const { data } = await supabase.from('series').select('*').order('year', { ascending: false })
      setSeries(data ?? [])
      resetForm()
    }
    setSaving(false)
  }

  if (loading) return <div className="p-8 text-ravens-muted">Loading...</div>

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Series</h1>
        <p className="text-sm text-ravens-muted mt-1">Create and manage race series.</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-ravens-surface border border-ravens-border rounded-lg p-6 space-y-4">
        <h2 className="text-base font-semibold text-white">
          {editingId ? 'Edit Series' : 'New Series'}
        </h2>

        {error && <p className="text-red-500 text-sm">{error}</p>}
        {success && <p className="text-green-500 text-sm">{success}</p>}

        <div className="space-y-1">
          <label className="text-sm text-ravens-muted">Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Mondello Series 2026"
            className="w-full p-2 rounded bg-ravens-dark border border-ravens-border text-white text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-ravens-muted">Year</label>
          <input
            type="number"
            value={year}
            onChange={e => setYear(parseInt(e.target.value))}
            className="w-full p-2 rounded bg-ravens-dark border border-ravens-border text-white text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-ravens-muted">Scoring Template</label>
          <select
            value={templateId}
            onChange={e => setTemplateId(e.target.value)}
            className="w-full p-2 rounded bg-ravens-dark border border-ravens-border text-white text-sm"
          >
            <option value="">Select a template...</option>
            {templates.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-ravens-red text-white px-4 py-2 rounded text-sm font-semibold disabled:opacity-50 hover:opacity-90"
          >
            {saving ? 'Saving...' : editingId ? 'Update Series' : 'Create Series'}
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

      {/* Series list */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-white">Existing Series</h2>
        {series.length === 0 ? (
          <p className="text-ravens-muted text-sm">No series yet.</p>
        ) : (
          <div className="space-y-2">
            {series.map(s => (
              <div
                key={s.id}
                className="flex items-center justify-between bg-ravens-surface border border-ravens-border rounded-lg px-4 py-3"
              >
                <div>
                  <p className="text-white text-sm font-medium">{s.name}</p>
                  <p className="text-ravens-muted text-xs">{s.year}</p>
                </div>
                <button
                  onClick={() => startEdit(s)}
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