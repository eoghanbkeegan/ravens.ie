'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type PointsEntry = { position: number; points: number }
type PrizeEntry = { position: number; amount: number }
type Prime = { name: string; points: number; prize: number }

type Template = {
  id: string
  name: string
  positions_that_score: number
  points_per_position: PointsEntry[]
  has_first_lady: boolean
  first_lady_points: number
  first_lady_prize: number
  has_first_junior: boolean
  first_junior_points: number
  first_junior_prize: number
  unplaced_points: Record<string, number>
  primes: Prime[]
  prize_per_position: PrizeEntry[]
}

const DEFAULT_POSITIONS = 6

function buildDefaultPoints(count: number): PointsEntry[] {
  return Array.from({ length: count }, (_, i) => ({
    position: i + 1,
    points: Math.max(0, count - i),
  }))
}

function buildDefaultPrizes(count: number): PrizeEntry[] {
  return Array.from({ length: count }, (_, i) => ({
    position: i + 1,
    amount: 0,
  }))
}

export default function AdminTemplatesPage() {
  const supabase = createClient()

  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [positionsCount, setPositionsCount] = useState(DEFAULT_POSITIONS)
  const [pointsPerPosition, setPointsPerPosition] = useState<PointsEntry[]>(
    buildDefaultPoints(DEFAULT_POSITIONS)
  )
  const [prizePerPosition, setPrizePerPosition] = useState<PrizeEntry[]>(
    buildDefaultPrizes(DEFAULT_POSITIONS)
  )
  const [hasFirstLady, setHasFirstLady] = useState(true)
  const [firstLadyPoints, setFirstLadyPoints] = useState(2)
  const [firstLadyPrize, setFirstLadyPrize] = useState(0)
  const [hasFirstJunior, setHasFirstJunior] = useState(true)
  const [firstJuniorPoints, setFirstJuniorPoints] = useState(2)
  const [firstJuniorPrize, setFirstJuniorPrize] = useState(0)
  const [unplacedC2, setUnplacedC2] = useState(1)
  const [unplacedC3, setUnplacedC3] = useState(1)
  const [primes, setPrimes] = useState<Prime[]>([{ name: 'Prime', points: 1, prize: 0 }])

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('scoring_templates')
        .select('*')
        .order('name')
      setTemplates(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  // When positions count changes, rebuild points and prizes arrays
  function handlePositionsCountChange(count: number) {
    setPositionsCount(count)
    setPointsPerPosition(buildDefaultPoints(count))
    setPrizePerPosition(buildDefaultPrizes(count))
  }

  function updatePoints(index: number, value: number) {
    setPointsPerPosition(prev => {
      const next = [...prev]
      next[index] = { ...next[index], points: value }
      return next
    })
  }

  function updatePrize(index: number, value: number) {
    setPrizePerPosition(prev => {
      const next = [...prev]
      next[index] = { ...next[index], amount: value }
      return next
    })
  }

  function updatePrime(index: number, field: keyof Prime, value: string | number) {
    setPrimes(prev => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  function addPrime() {
    setPrimes(prev => [...prev, { name: `Prime ${prev.length + 1}`, points: 1, prize: 0 }])
  }

  function removePrime(index: number) {
    setPrimes(prev => prev.filter((_, i) => i !== index))
  }

  function resetForm() {
    setEditingId(null)
    setName('')
    setPositionsCount(DEFAULT_POSITIONS)
    setPointsPerPosition(buildDefaultPoints(DEFAULT_POSITIONS))
    setPrizePerPosition(buildDefaultPrizes(DEFAULT_POSITIONS))
    setHasFirstLady(true)
    setFirstLadyPoints(2)
    setFirstLadyPrize(0)
    setHasFirstJunior(true)
    setFirstJuniorPoints(2)
    setFirstJuniorPrize(0)
    setUnplacedC2(1)
    setUnplacedC3(1)
    setPrimes([{ name: 'Prime', points: 1, prize: 0 }])
    setError('')
    setSuccess('')
  }

  function startEdit(t: Template) {
    setEditingId(t.id)
    setName(t.name)
    setPositionsCount(t.positions_that_score)
    setPointsPerPosition(t.points_per_position)
    setPrizePerPosition(t.prize_per_position)
    setHasFirstLady(t.has_first_lady)
    setFirstLadyPoints(t.first_lady_points)
    setFirstLadyPrize(t.first_lady_prize ?? 0)
    setHasFirstJunior(t.has_first_junior)
    setFirstJuniorPoints(t.first_junior_points)
    setFirstJuniorPrize(t.first_junior_prize ?? 0)
    setUnplacedC2(t.unplaced_points?.C2 ?? 0)
    setUnplacedC3(t.unplaced_points?.C3 ?? 0)
    setPrimes(t.primes ?? [])
    setError('')
    setSuccess('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name) {
      setError('Name is required')
      return
    }
    setSaving(true)
    setError('')

    const payload = {
      name,
      positions_that_score: positionsCount,
      points_per_position: pointsPerPosition,
      prize_per_position: prizePerPosition,
      has_first_lady: hasFirstLady,
      first_lady_points: firstLadyPoints,
      first_lady_prize: firstLadyPrize,
      has_first_junior: hasFirstJunior,
      first_junior_points: firstJuniorPoints,
      first_junior_prize: firstJuniorPrize,
      unplaced_points: { C2: unplacedC2, C3: unplacedC3 },
      primes,
    }

    const { error: err } = editingId
      ? await supabase.from('scoring_templates').update(payload).eq('id', editingId)
      : await supabase.from('scoring_templates').insert(payload)

    if (err) {
      setError(err.message)
    } else {
      setSuccess(editingId ? 'Template updated.' : 'Template created.')
      const { data } = await supabase.from('scoring_templates').select('*').order('name')
      setTemplates(data ?? [])
      resetForm()
    }
    setSaving(false)
  }

  if (loading) return <div className="p-8 text-ravens-muted">Loading...</div>

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Scoring Templates</h1>
        <p className="text-sm text-ravens-muted mt-1">
          Define points, prizes and bonuses for a series.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-ravens-surface border border-ravens-border rounded-lg p-6 space-y-6">
        <h2 className="text-base font-semibold text-white">
          {editingId ? 'Edit Template' : 'New Template'}
        </h2>

        {error && <p className="text-red-500 text-sm">{error}</p>}
        {success && <p className="text-green-500 text-sm">{success}</p>}

        {/* Name */}
        <div className="space-y-1">
          <label className="text-sm text-ravens-muted">Template Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Mondello Series 2026"
            className="w-full p-2 rounded bg-ravens-dark border border-ravens-border text-white text-sm"
          />
        </div>

        {/* Positions that score */}
        <div className="space-y-1">
          <label className="text-sm text-ravens-muted">Positions That Score</label>
          <input
            type="number"
            min={1}
            max={10}
            value={positionsCount}
            onChange={e => handlePositionsCountChange(parseInt(e.target.value))}
            className="w-24 p-2 rounded bg-ravens-dark border border-ravens-border text-white text-sm"
          />
        </div>

        {/* Points per position */}
        <div className="space-y-2">
          <label className="text-sm text-ravens-muted">Points Per Position</label>
          <div className="space-y-2">
            {pointsPerPosition.map((entry, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="w-16 text-sm text-ravens-muted">P{entry.position}</span>
                <input
                  type="number"
                  min={0}
                  value={entry.points}
                  onChange={e => updatePoints(i, parseInt(e.target.value))}
                  className="w-20 p-2 rounded bg-ravens-dark border border-ravens-border text-white text-sm"
                />
                <span className="text-xs text-ravens-muted">pts</span>
              </div>
            ))}
          </div>
        </div>

        {/* Prize per position */}
        <div className="space-y-2">
          <label className="text-sm text-ravens-muted">Prize Money Per Position (€)</label>
          <div className="space-y-2">
            {prizePerPosition.map((entry, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="w-16 text-sm text-ravens-muted">P{entry.position}</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={entry.amount}
                  onChange={e => updatePrize(i, parseFloat(e.target.value))}
                  className="w-24 p-2 rounded bg-ravens-dark border border-ravens-border text-white text-sm"
                />
                <span className="text-xs text-ravens-muted">€</span>
              </div>
            ))}
          </div>
        </div>

        {/* First Lady */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="has-first-lady"
              checked={hasFirstLady}
              onChange={e => setHasFirstLady(e.target.checked)}
              className="accent-ravens-red w-4 h-4"
            />
            <label htmlFor="has-first-lady" className="text-sm text-white cursor-pointer font-medium">
              First Lady Bonus
            </label>
          </div>
          {hasFirstLady && (
            <div className="flex gap-6 pl-7">
              <div className="space-y-1">
                <label className="text-xs text-ravens-muted">Points</label>
                <input
                  type="number"
                  min={0}
                  value={firstLadyPoints}
                  onChange={e => setFirstLadyPoints(parseInt(e.target.value))}
                  className="w-20 p-2 rounded bg-ravens-dark border border-ravens-border text-white text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-ravens-muted">Prize (€)</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={firstLadyPrize}
                  onChange={e => setFirstLadyPrize(parseFloat(e.target.value))}
                  className="w-24 p-2 rounded bg-ravens-dark border border-ravens-border text-white text-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* First Junior */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="has-first-junior"
              checked={hasFirstJunior}
              onChange={e => setHasFirstJunior(e.target.checked)}
              className="accent-ravens-red w-4 h-4"
            />
            <label htmlFor="has-first-junior" className="text-sm text-white cursor-pointer font-medium">
              First Junior Bonus
            </label>
          </div>
          {hasFirstJunior && (
            <div className="flex gap-6 pl-7">
              <div className="space-y-1">
                <label className="text-xs text-ravens-muted">Points</label>
                <input
                  type="number"
                  min={0}
                  value={firstJuniorPoints}
                  onChange={e => setFirstJuniorPoints(parseInt(e.target.value))}
                  className="w-20 p-2 rounded bg-ravens-dark border border-ravens-border text-white text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-ravens-muted">Prize (€)</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={firstJuniorPrize}
                  onChange={e => setFirstJuniorPrize(parseFloat(e.target.value))}
                  className="w-24 p-2 rounded bg-ravens-dark border border-ravens-border text-white text-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* Unplaced points */}
        <div className="space-y-2">
          <label className="text-sm text-ravens-muted font-medium text-white">Unplaced Category Points</label>
          <div className="flex gap-6">
            <div className="space-y-1">
              <label className="text-xs text-ravens-muted">C2</label>
              <input
                type="number"
                min={0}
                value={unplacedC2}
                onChange={e => setUnplacedC2(parseInt(e.target.value))}
                className="w-20 p-2 rounded bg-ravens-dark border border-ravens-border text-white text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-ravens-muted">C3</label>
              <input
                type="number"
                min={0}
                value={unplacedC3}
                onChange={e => setUnplacedC3(parseInt(e.target.value))}
                className="w-20 p-2 rounded bg-ravens-dark border border-ravens-border text-white text-sm"
              />
            </div>
          </div>
        </div>

        {/* Primes */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-white">Primes</label>
          {primes.map((prime, i) => (
            <div key={i} className="flex items-center gap-3">
              <input
                value={prime.name}
                onChange={e => updatePrime(i, 'name', e.target.value)}
                placeholder="Prime name"
                className="flex-1 p-2 rounded bg-ravens-dark border border-ravens-border text-white text-sm"
              />
              <input
                type="number"
                min={0}
                value={prime.points}
                onChange={e => updatePrime(i, 'points', parseInt(e.target.value))}
                className="w-16 p-2 rounded bg-ravens-dark border border-ravens-border text-white text-sm"
                placeholder="pts"
              />
              <span className="text-xs text-ravens-muted">pts</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={prime.prize}
                onChange={e => updatePrime(i, 'prize', parseFloat(e.target.value))}
                className="w-20 p-2 rounded bg-ravens-dark border border-ravens-border text-white text-sm"
                placeholder="€"
              />
              <span className="text-xs text-ravens-muted">€</span>
              <button
                type="button"
                onClick={() => removePrime(i)}
                className="text-ravens-muted hover:text-red-500 text-sm px-2"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addPrime}
            className="text-xs text-ravens-muted hover:text-white border border-ravens-border rounded px-3 py-1"
          >
            + Add Prime
          </button>
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-ravens-red text-white px-4 py-2 rounded text-sm font-semibold disabled:opacity-50 hover:opacity-90"
          >
            {saving ? 'Saving...' : editingId ? 'Update Template' : 'Create Template'}
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

      {/* Templates list */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-white">Existing Templates</h2>
        {templates.length === 0 ? (
          <p className="text-ravens-muted text-sm">No templates yet.</p>
        ) : (
          <div className="space-y-2">
            {templates.map(t => (
              <div
                key={t.id}
                className="flex items-center justify-between bg-ravens-surface border border-ravens-border rounded-lg px-4 py-3"
              >
                <div>
                  <p className="text-white text-sm font-medium">{t.name}</p>
                  <p className="text-ravens-muted text-xs">
                    Top {t.positions_that_score} score · {t.primes?.length ?? 0} prime(s)
                  </p>
                </div>
                <button
                  onClick={() => startEdit(t)}
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