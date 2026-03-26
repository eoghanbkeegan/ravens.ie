'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Fixture {
  id: string
  title: string
  date: string
  venue: string
  status: 'upcoming' | 'completed' | 'cancelled'
  series_id: string
}

interface Result {
  position: number | null
  points_earned: number | null
  prize_amount: number | null
  is_first_lady: boolean
  is_first_junior: boolean
  prime_won: string | null
  riders: {
    name: string
    team: string | null
    category: string | null
  }
}

interface FixtureResultsResponse {
  fixture: Fixture
  results: Result[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatCurrency(amount: number | null) {
  if (amount == null) return '—'
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
  }).format(amount)
}

function StatusBadge({ status }: { status: Fixture['status'] }) {
  const styles: Record<Fixture['status'], string> = {
    completed: 'bg-green-100 text-green-800',
    upcoming:  'bg-blue-100 text-blue-800',
    cancelled: 'bg-red-100 text-red-800',
  }
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${styles[status]}`}>
      {status}
    </span>
  )
}

function Badge({ label, colour }: { label: string; colour: string }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${colour}`}>
      {label}
    </span>
  )
}

// ─── Result Row ───────────────────────────────────────────────────────────────

function ResultRow({ result, index }: { result: Result; index: number }) {
  const isPlaced  = result.position != null
  const rowBg     = index % 2 === 0 ? 'bg-white' : 'bg-gray-50'

  return (
    <tr className={`${rowBg} ${!isPlaced ? 'opacity-70' : ''}`}>
      {/* Position */}
      <td className="px-4 py-3 text-center w-12">
        {isPlaced ? (
          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold
            ${result.position === 1 ? 'bg-yellow-400 text-yellow-900' :
              result.position === 2 ? 'bg-gray-300 text-gray-800' :
              result.position === 3 ? 'bg-amber-600 text-white' :
              'bg-gray-100 text-gray-700'}`}>
            {result.position}
          </span>
        ) : (
          <span className="text-gray-400 text-sm">—</span>
        )}
      </td>

      {/* Rider */}
      <td className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-medium text-gray-900">{result.riders.name}</span>
          {result.is_first_lady   && <Badge label="🌸 First Lady"   colour="bg-pink-100 text-pink-700" />}
          {result.is_first_junior && <Badge label="⭐ First Junior" colour="bg-purple-100 text-purple-700" />}
          {result.prime_won       && (
            <Badge label={`🏅 Prime: ${result.prime_won}`} colour="bg-orange-100 text-orange-700" />
          )}
        </div>
      </td>

      {/* Team */}
      <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">
        {result.riders.team ?? '—'}
      </td>

      {/* Category */}
      <td className="px-4 py-3 text-center">
        {result.riders.category ? (
          <span className="rounded bg-gray-200 px-2 py-0.5 text-xs font-mono font-semibold text-gray-700">
            {result.riders.category}
          </span>
        ) : '—'}
      </td>

      {/* Points */}
      <td className="px-4 py-3 text-center text-sm font-medium text-gray-800">
        {result.points_earned ?? '—'}
      </td>

      {/* Prize */}
      <td className="px-4 py-3 text-right text-sm text-gray-700">
        {formatCurrency(result.prize_amount)}
      </td>
    </tr>
  )
}

// ─── Divider between placed / unplaced ───────────────────────────────────────

function UnplacedDivider() {
  return (
    <tr>
      <td colSpan={6} className="px-4 py-2 bg-gray-100 text-xs text-gray-500 font-medium uppercase tracking-wide">
        Unplaced — Category points only
      </td>
    </tr>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FixtureResultsPage() {
  const { fixtureId } = useParams<{ fixtureId: string }>()
  const router        = useRouter()

  const [data,    setData]    = useState<FixtureResultsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    if (!fixtureId) return
    setLoading(true)
    fetch(`/api/fixtures/${fixtureId}/results`)
      .then(res => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
        return res.json() as Promise<FixtureResultsResponse>
      })
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [fixtureId])

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 text-sm">Loading results…</p>
        </div>
      </div>
    )
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <p className="text-5xl">🚴</p>
          <h1 className="text-xl font-semibold text-gray-800">Results not found</h1>
          <p className="text-gray-500 text-sm">{error ?? 'No data returned from server.'}</p>
          <button
            onClick={() => router.back()}
            className="mt-2 rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 transition-colors"
          >
            ← Go back
          </button>
        </div>
      </div>
    )
  }

  const { fixture, results } = data

  const placed   = results.filter(r => r.position != null)
  const unplaced = results.filter(r => r.position == null)

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">

        {/* ── Back link ──────────────────────────────────────────────────── */}
        <Link
          href={`/series/${fixture.series_id}`}
          className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 transition-colors"
        >
          ← Series standings
        </Link>

        {/* ── Fixture header ─────────────────────────────────────────────── */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-gray-900">{fixture.title}</h1>
              <p className="text-sm text-gray-500">
                📅 {formatDate(fixture.date)}
              </p>
              <p className="text-sm text-gray-500">
                📍 {fixture.venue}
              </p>
            </div>
            <StatusBadge status={fixture.status} />
          </div>
        </div>

        {/* ── Results table ──────────────────────────────────────────────── */}
        {results.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-500">
            No results have been posted for this fixture yet.
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">Race Results</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {placed.length} classified · {unplaced.length} unplaced
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                    <th className="px-4 py-3 text-center w-12">#</th>
                    <th className="px-4 py-3 text-left">Rider</th>
                    <th className="px-4 py-3 text-left hidden sm:table-cell">Team</th>
                    <th className="px-4 py-3 text-center">Cat.</th>
                    <th className="px-4 py-3 text-center">Pts</th>
                    <th className="px-4 py-3 text-right">Prize</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {placed.map((r, i) => (
                    <ResultRow key={i} result={r} index={i} />
                  ))}
                  {unplaced.length > 0 && (
                    <>
                      <UnplacedDivider />
                      {unplaced.map((r, i) => (
                        <ResultRow key={`u-${i}`} result={r} index={i} />
                      ))}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Legend ─────────────────────────────────────────────────────── */}
        {results.some(r => r.is_first_lady || r.is_first_junior || r.prime_won) && (
          <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Legend</h3>
            <div className="flex flex-wrap gap-3">
              {results.some(r => r.is_first_lady) && (
                <Badge label="🌸 First Lady" colour="bg-pink-100 text-pink-700" />
              )}
              {results.some(r => r.is_first_junior) && (
                <Badge label="⭐ First Junior" colour="bg-purple-100 text-purple-700" />
              )}
              {results.some(r => r.prime_won) && (
                <Badge label="🏅 Prime winner" colour="bg-orange-100 text-orange-700" />
              )}
            </div>
          </div>
        )}

      </div>
    </main>
  )
}
