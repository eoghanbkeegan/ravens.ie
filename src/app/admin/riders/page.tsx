'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

// Outside component to prevent re-render loop
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Fixture = {
  id: string
  title: string
  date: string
  series_id: string
}

type Rider = {
  id: string
  name: string
  team: string | null
  category: string | null
  email: string | null
  cycling_ireland_num: string | null
}

type ImportResult = {
  success: boolean
  imported: number
  errors: string[]
}

const catColour: Record<string, string> = {
  C1: 'bg-violet-900/40 text-violet-300',
  C2: 'bg-sky-900/40 text-sky-300',
  C3: 'bg-emerald-900/40 text-emerald-300',
}

export default function RidersPage() {
  const [fixtures, setFixtures] = useState<Fixture[]>([])
  const [selectedFixtureId, setSelectedFixtureId] = useState('')
  const [selectedSeriesId, setSelectedSeriesId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [riders, setRiders] = useState<Rider[]>([])
  const [importing, setImporting] = useState(false)
  const [loadingRiders, setLoadingRiders] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    supabase
      .from('fixtures')
      .select('id, title, date, series_id')
      .order('date', { ascending: true })
      .then(({ data }) => setFixtures(data ?? []))
  }, [])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!selectedFixtureId) { setRiders([]); return }
    setLoadingRiders(true)
    setResult(null)
    supabase
      .from('fixture_riders')
      .select('riders (id, name, team, category, email, cycling_ireland_num)')
      .eq('fixture_id', selectedFixtureId)
      .then(({ data }) => {
        const flat = (data ?? [])
          .flatMap(r => {
            const rider = r.riders
            if (!rider) return []
            return Array.isArray(rider) ? rider : [rider]
          })
          .filter((r): r is Rider => r !== null && r !== undefined)
        setRiders(flat)
        setLoadingRiders(false)
      })
  }, [selectedFixtureId])

  function handleFixtureChange(id: string) {
    setSelectedFixtureId(id)
    const fixture = fixtures.find(f => f.id === id)
    setSelectedSeriesId(fixture?.series_id ?? '')
    setFile(null)
    setResult(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleImport() {
    if (!selectedFixtureId || !selectedSeriesId || !file) return
    setImporting(true)
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('fixture_id', selectedFixtureId)
    formData.append('series_id', selectedSeriesId)

    try {
      const res = await fetch('/api/riders/import', { method: 'POST', body: formData })
      const json: ImportResult = await res.json()
      setResult(json)

      if (json.success) {
        setLoadingRiders(true)
        const { data } = await supabase
          .from('fixture_riders')
          .select('riders (id, name, team, category, email, cycling_ireland_num)')
          .eq('fixture_id', selectedFixtureId)
        const flat = (data ?? [])
          .flatMap(r => {
            const rider = r.riders
            if (!rider) return []
            return Array.isArray(rider) ? rider : [rider]
          })
          .filter((r): r is Rider => r !== null && r !== undefined)
        setRiders(flat)
        setLoadingRiders(false)
        setFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    } catch {
      setResult({ success: false, imported: 0, errors: ['Unexpected error during import.'] })
    } finally {
      setImporting(false)
    }
  }

  const selectedFixture = fixtures.find(f => f.id === selectedFixtureId)
  const canImport = !!selectedFixtureId && !!file && !importing

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-8">

      {/* Header */}
      <div>
        <div className="text-xs font-semibold tracking-[0.15em] uppercase text-indigo-400 mb-2">Admin</div>
        <h1 className="text-3xl font-bold text-white">Import Riders</h1>
        <p className="text-ravens-muted text-sm mt-1">Upload Event Master CSV or Excel to import riders for a fixture.</p>
      </div>

      {/* Import card */}
      <div className="bg-ravens-surface border border-ravens-border rounded-xl p-6 space-y-5">

        {/* Fixture selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium uppercase tracking-wider text-ravens-muted">Fixture</label>
          <select
            value={selectedFixtureId}
            onChange={e => handleFixtureChange(e.target.value)}
            className="w-full rounded-lg px-3 py-2.5 text-white text-sm outline-none"
            style={{ background: '#0A0A0A', border: '1px solid rgba(37,37,37,1)' }}
          >
            <option value="">Select a fixture…</option>
            {fixtures.map(f => (
              <option key={f.id} value={f.id}>
                {f.title} — {new Date(f.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </option>
            ))}
          </select>
        </div>

        {/* File input */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium uppercase tracking-wider text-ravens-muted">
            Event Master Export <span className="normal-case font-normal">(CSV or Excel)</span>
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={e => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-ravens-muted cursor-pointer
              file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0
              file:text-sm file:font-medium file:cursor-pointer
              file:bg-indigo-900/40 file:text-indigo-300
              hover:file:bg-indigo-900/60"
          />
          {file && (
            <p className="text-xs text-ravens-muted">{file.name} — {(file.size / 1024).toFixed(1)} KB</p>
          )}
        </div>

        {/* Import button */}
        <button
          onClick={handleImport}
          disabled={!canImport}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer border-none"
          style={{ background: 'linear-gradient(135deg, #1E1A50, #2D2870)' }}
        >
          {importing ? (
            <>
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Importing…
            </>
          ) : 'Import Riders'}
        </button>

        {/* Result banner */}
        {result && (
          <div className={`rounded-lg border px-4 py-3 text-sm space-y-1 ${
            result.success && result.errors.length === 0
              ? 'bg-green-900/20 border-green-800/50 text-green-400'
              : result.success
              ? 'bg-yellow-900/20 border-yellow-800/50 text-yellow-400'
              : 'bg-red-900/20 border-red-800/50 text-red-400'
          }`}>
            {result.success ? (
              <p className="font-medium">✓ {result.imported} rider{result.imported !== 1 ? 's' : ''} imported successfully.</p>
            ) : (
              <p className="font-medium">✕ Import failed.</p>
            )}
            {result.errors.length > 0 && (
              <ul className="list-disc list-inside space-y-0.5 text-xs opacity-80">
                {result.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Riders table */}
      {selectedFixtureId && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              {selectedFixture?.title} — Startlist
            </h2>
            {!loadingRiders && (
              <span className="text-sm text-ravens-muted">{riders.length} rider{riders.length !== 1 ? 's' : ''}</span>
            )}
          </div>

          {loadingRiders ? (
            <div className="flex items-center justify-center py-12 text-ravens-muted text-sm gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Loading riders…
            </div>
          ) : riders.length === 0 ? (
            <div className="rounded-xl border border-dashed border-ravens-border py-12 text-center text-ravens-muted text-sm">
              No riders imported for this fixture yet.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-ravens-border">
              <table className="min-w-full divide-y divide-ravens-border text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold text-ravens-muted uppercase tracking-wider">
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Club / Team</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">CI Licence</th>
                    <th className="px-4 py-3">Email</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ravens-border">
                  {riders.map(r => (
                    <tr key={r.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 font-medium text-white">{r.name}</td>
                      <td className="px-4 py-3 text-ravens-muted">{r.team ?? <span className="opacity-30">—</span>}</td>
                      <td className="px-4 py-3">
                        {r.category ? (
                          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${catColour[r.category] ?? 'bg-white/5 text-ravens-muted'}`}>
                            {r.category}
                          </span>
                        ) : <span className="text-ravens-muted opacity-30">—</span>}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-ravens-muted">
                        {r.cycling_ireland_num ?? <span className="opacity-30">—</span>}
                      </td>
                      <td className="px-4 py-3 text-ravens-muted">
                        {r.email ? (
                          <a href={`mailto:${r.email}`} className="hover:text-white transition-colors no-underline">
                            {r.email}
                          </a>
                        ) : <span className="opacity-30">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}