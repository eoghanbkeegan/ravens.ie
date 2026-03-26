'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

// ─── Types ────────────────────────────────────────────────────────────────────

interface RoundDetail {
  round: number
  label?: string
  points: number
}

interface Standing {
  id: string
  series_id: string
  rank: number
  rider_name: string
  team?: string
  category: 'C1' | 'C2' | 'C3'
  total_points: number
  wins: number
  podiums: number
  races_entered: number
  round_details: RoundDetail[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORY_COLOURS: Record<string, string> = {
  C1: 'bg-violet-100 text-violet-800',
  C2: 'bg-sky-100 text-sky-800',
  C3: 'bg-emerald-100 text-emerald-800',
}

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

function RankBadge({ rank }: { rank: number }) {
  if (rank <= 3)
    return (
      <span className="text-xl leading-none" aria-label={`Rank ${rank}`}>
        {MEDAL[rank]}
      </span>
    )
  return <span className="tabular-nums font-semibold text-gray-500">{rank}</span>
}

function StatPill({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex flex-col items-center rounded-lg bg-gray-50 px-3 py-1.5 min-w-[52px]">
      <span className="text-[11px] uppercase tracking-wide text-gray-400">{label}</span>
      <span className="text-sm font-bold text-gray-800">{value}</span>
    </div>
  )
}

// ─── Round points mini-chart ──────────────────────────────────────────────────

function RoundPointsRow({ rounds }: { rounds: RoundDetail[] }) {
  if (!rounds?.length) return null
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {rounds.map((r) => (
        <div
          key={r.round}
          title={r.label ?? `Round ${r.round}`}
          className="flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
        >
          <span className="font-medium text-gray-400">R{r.round}</span>
          <span className="font-semibold text-gray-700">{r.points}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Row ──────────────────────────────────────────────────────────────────────

function StandingRow({ s, showRounds }: { s: Standing; showRounds: boolean }) {
  return (
    <li className="group rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm transition hover:shadow-md">
      <div className="flex items-start gap-4">
        {/* Rank */}
        <div className="flex w-8 shrink-0 items-center justify-center pt-0.5">
          <RankBadge rank={s.rank} />
        </div>

        {/* Rider info */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate font-semibold text-gray-900">{s.rider_name}</span>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                CATEGORY_COLOURS[s.category] ?? 'bg-gray-100 text-gray-600'
              }`}
            >
              {s.category}
            </span>
          </div>
          {s.team && (
            <p className="mt-0.5 truncate text-sm text-gray-500">{s.team}</p>
          )}
          {showRounds && <RoundPointsRow rounds={s.round_details} />}
        </div>

        {/* Stats */}
        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
          <StatPill label="PTS" value={s.total_points} />
          <StatPill label="Wins" value={s.wins} />
          <StatPill label="Podiums" value={s.podiums} />
          <StatPill label="Races" value={s.races_entered} />
        </div>
      </div>
    </li>
  )
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <li className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
      <div className="flex animate-pulse items-center gap-4">
        <div className="h-6 w-6 rounded-full bg-gray-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-40 rounded bg-gray-200" />
          <div className="h-3 w-24 rounded bg-gray-100" />
        </div>
        <div className="flex gap-1.5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 w-12 rounded-lg bg-gray-100" />
          ))}
        </div>
      </div>
    </li>
  )
}

// ─── Category filter tabs ─────────────────────────────────────────────────────

const CATEGORIES = ['All', 'C1', 'C2', 'C3'] as const
type Filter = (typeof CATEGORIES)[number]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StandingsPage() {
  const searchParams = useSearchParams()
  const seriesId = searchParams.get('seriesId') ?? 'default'

  const [standings, setStandings] = useState<Standing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('All')
  const [showRounds, setShowRounds] = useState(false)

  useEffect(() => {
    if (!seriesId) return
    setLoading(true)
    setError(null)

    fetch(`/api/standings/${seriesId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`)
        return res.json()
      })
      .then((data: Standing[]) => setStandings(data))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [seriesId])

  const filtered =
    filter === 'All' ? standings : standings.filter((s) => s.category === filter)

  // Detect whether any round_details exist at all
  const hasRoundData = standings.some((s) => s.round_details?.length)

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Series Standings
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Series <code className="rounded bg-gray-100 px-1">{seriesId}</code>
            </p>
          </div>

          {/* Round points toggle */}
          {hasRoundData && (
            <button
              onClick={() => setShowRounds((v) => !v)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 shadow-sm transition hover:bg-gray-50"
            >
              {showRounds ? 'Hide' : 'Show'} round points
            </button>
          )}
        </div>

        {/* Category filter */}
        <div className="mb-4 flex gap-1 rounded-xl bg-gray-100 p-1 w-fit">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
                filter === cat
                  ? 'bg-white shadow text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <ul className="space-y-2">
            {[...Array(6)].map((_, i) => <SkeletonRow key={i} />)}
          </ul>
        ) : error ? (
          <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-center text-sm text-red-600">
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
            <p className="text-2xl">🏁</p>
            <p className="mt-2 font-semibold text-gray-700">No results yet</p>
            <p className="mt-1 text-sm text-gray-400">
              Check back after Round 1
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {filtered.map((s) => (
              <StandingRow key={s.id} s={s} showRounds={showRounds} />
            ))}
          </ul>
        )}

        {/* Footer count */}
        {!loading && !error && filtered.length > 0 && (
          <p className="mt-4 text-center text-xs text-gray-400">
            {filtered.length} rider{filtered.length !== 1 ? 's' : ''}
            {filter !== 'All' ? ` in ${filter}` : ''}
          </p>
        )}
      </div>
    </main>
  )
}
