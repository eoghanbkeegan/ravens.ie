
'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

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

export default function RidersPage() {
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

  const [fixtures, setFixtures] = useState<Fixture[]>([])
  const [selectedFixtureId, setSelectedFixtureId] = useState('')
  const [selectedSeriesId, setSelectedSeriesId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [riders, setRiders] = useState<Rider[]>([])
  const [importing, setImporting] = useState(false)
  const [loadingRiders, setLoadingRiders] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load fixtures on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    supabase
      .from('fixtures')
      .select('id, title, date, series_id')
      .order('date', { ascending: true })
      .then(({ data }) => setFixtures(data ?? []))
  }, [])

  // Load riders when fixture changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!selectedFixtureId) {
      setRiders([])
      return
    }
    setLoadingRiders(true)
    setResult(null)
    supabase
      .from('fixture_riders')
      .select('riders (id, name, team, category, email, cycling_ireland_num)')
      .eq('fixture_id', selectedFixtureId)
      .then(({ data }) => {
const flat = (data ?? [])
  .flatMap((r) => {
    const rider = r.riders
    if (!rider) return []
    return Array.isArray(rider) ? rider : [rider]
  })
  .filter((r): r is Rider => r !== null && r !== undefined)
setRiders(flat as Rider[])
        setRiders(flat)
        setLoadingRiders(false)
      })
  }, [selectedFixtureId])

  function handleFixtureChange(id: string) {
    setSelectedFixtureId(id)
    const fixture = fixtures.find((f) => f.id === id)
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
      const res = await fetch('/api/riders/import', {
        method: 'POST',
        body: formData,
      })
      const json: ImportResult = await res.json()
      setResult(json)

      if (json.success) {
        // Refresh riders table
        setLoadingRiders(true)
        const { data } = await supabase
          .from('fixture_riders')
          .select('riders (id, name, team, category, email, cycling_ireland_num)')
          .eq('fixture_id', selectedFixtureId)
const flat = (data ?? [])
  .flatMap((r) => {
    const rider = r.riders
    if (!rider) return []
    return Array.isArray(rider) ? rider : [rider]
  })
  .filter((r): r is Rider => r !== null && r !== undefined)
setRiders(flat as Rider[])
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

  const selectedFixture = fixtures.find((f) => f.id === selectedFixtureId)
  const canImport = !!selectedFixtureId && !!file && !importing

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <h1 className="text-2xl font-semibold text-gray-900">Import Riders</h1>

      {/* ── Import card ──────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5 shadow-sm">

        {/* Fixture selector */}
        <div className="space-y-1">
          <label htmlFor="fixture" className="block text-sm font-medium text-gray-700">
            Fixture
          </label>
          <select
            id="fixture"
            value={selectedFixtureId}
            onChange={(e) => handleFixtureChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select a fixture…</option>
            {fixtures.map((f) => (
              <option key={f.id} value={f.id}>
                {f.title} — {new Date(f.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </option>
            ))}
          </select>
        </div>

        {/* File input */}
        <div className="space-y-1">
          <label htmlFor="file" className="block text-sm font-medium text-gray-700">
            Event Master export{' '}
            <span className="font-normal text-gray-400">(CSV or Excel)</span>
          </label>
          <input
            id="file"
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-gray-500
              file:mr-3 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-medium
              file:bg-indigo-50 file:text-indigo-700
              hover:file:bg-indigo-100 cursor-pointer"
          />
          {file && (
            <p className="text-xs text-gray-500">{file.name} — {(file.size / 1024).toFixed(1)} KB</p>
          )}
        </div>

        {/* Import button */}
        <button
          onClick={handleImport}
          disabled={!canImport}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm
            hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {importing ? (
            <>
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Importing…
            </>
          ) : (
            'Import Riders'
          )}
        </button>

        {/* Result banner */}
        {result && (
          <div
            className={`rounded-lg border px-4 py-3 text-sm space-y-2 ${
              result.success && result.errors.length === 0
                ? 'border-green-200 bg-green-50 text-green-800'
                : result.success
                ? 'border-yellow-200 bg-yellow-50 text-yellow-800'
                : 'border-red-200 bg-red-50 text-red-800'
            }`}
          >
            {result.success ? (
              <p className="font-medium">
                ✓ {result.imported} rider{result.imported !== 1 ? 's' : ''} imported successfully.
              </p>
            ) : (
              <p className="font-medium">✕ Import failed.</p>
            )}
            {result.errors.length > 0 && (
              <ul className="list-disc list-inside space-y-0.5 text-xs">
                {result.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* ── Riders table ─────────────────────────────────────────── */}
      {selectedFixtureId && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">
              Riders — {selectedFixture?.title}
            </h2>
            {!loadingRiders && (
              <span className="text-sm text-gray-500">{riders.length} rider{riders.length !== 1 ? 's' : ''}</span>
            )}
          </div>

          {loadingRiders ? (
            <div className="flex items-center justify-center py-12 text-gray-400 text-sm gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Loading riders…
            </div>
          ) : riders.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center text-sm text-gray-400">
              No riders imported for this fixture yet.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
              <table className="min-w-full divide-y divide-gray-100 text-sm">
                <thead className="bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Club / Team</th>
                    <th className="px-4 py-3 text-left">Category</th>
                    <th className="px-4 py-3 text-left">CI Licence</th>
                    <th className="px-4 py-3 text-left">Email</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {riders.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{r.name}</td>
                      <td className="px-4 py-3 text-gray-600">{r.team ?? <span className="text-gray-300">—</span>}</td>
                      <td className="px-4 py-3">
                        {r.category ? (
                          <span className="inline-block rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                            {r.category}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">
                        {r.cycling_ireland_num ?? <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {r.email ? (
                          <a href={`mailto:${r.email}`} className="hover:text-indigo-600 hover:underline">
                            {r.email}
                          </a>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
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
