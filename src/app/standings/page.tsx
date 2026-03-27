'use client'

import { useEffect, useState, Suspense } from 'react'
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
  name: string
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
  C1: 'bg-violet-900/40 text-violet-300',
  C2: 'bg-sky-900/40 text-sky-300',
  C3: 'bg-emerald-900/40 text-emerald-300',
}

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

function RankDisplay({ rank }: { rank: number }) {
  if (rank <= 3) return <span className="text-xl leading-none">{MEDAL[rank]}</span>
  return (
    <span
      className="text-sm font-bold tabular-nums"
      style={{ color: 'rgba(255,255,255,0.3)' }}
    >
      {rank}
    </span>
  )
}

function StatPill({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex flex-col items-center rounded-lg px-3 py-1.5 min-w-[48px]"
      style={{ background: 'rgba(255,255,255,0.05)' }}>
      <span className="text-[10px] uppercase tracking-wide text-ravens-muted">{label}</span>
      <span className="text-sm font-bold text-white">{value}</span>
    </div>
  )
}

function RoundPips({ rounds }: { rounds: RoundDetail[] }) {
  if (!rounds?.length) return null
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {rounds.map(r => (
        <div
          key={r.round}
          title={r.label ?? `Round ${r.round}`}
          className="flex items-center gap-1 rounded px-2 py-0.5 text-xs"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        >
          <span className="font-medium text-ravens-muted">R{r.round}</span>
          <span className="font-semibold text-white">{r.points}</span>
        </div>
      ))}
    </div>
  )
}

function StandingRow({ s, showRounds }: { s: Standing; showRounds: boolean }) {
  const isTop3 = s.rank <= 3
  return (
    <li
      className="rounded-xl border px-4 py-3 transition-all group relative overflow-hidden"
      style={{
        background: isTop3 ? 'rgba(30,26,80,0.3)' : 'rgba(22,22,22,1)',
        borderColor: isTop3 ? 'rgba(139,133,208,0.25)' : 'rgba(37,37,37,1)',
      }}
    >
      {isTop3 && (
        <div
          className="absolute top-0 left-0 bottom-0 w-0.5"
          style={{ background: 'linear-gradient(to bottom, #8B85D0, #1E1A50)' }}
        />
      )}
      <div className="flex items-center gap-4">
        <div className="flex w-8 shrink-0 items-center justify-center">
          <RankDisplay rank={s.rank} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-white text-sm truncate">{s.name}</span>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${CATEGORY_COLOURS[s.category] ?? 'bg-white/5 text-ravens-muted'}`}>
              {s.category}
            </span>
          </div>
          {s.team && (
            <p className="mt-0.5 truncate text-xs text-ravens-muted">{s.team}</p>
          )}
          {showRounds && <RoundPips rounds={s.round_details} />}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
          <StatPill label="PTS" value={s.total_points} />
          <StatPill label="Wins" value={s.wins} />
          <StatPill label="Pods" value={s.podiums} />
          <StatPill label="Races" value={s.races_entered} />
        </div>
      </div>
    </li>
  )
}

function SkeletonRow() {
  return (
    <li className="rounded-xl border border-ravens-border px-4 py-3 bg-ravens-surface">
      <div className="flex animate-pulse items-center gap-4">
        <div className="h-6 w-6 rounded-full bg-white/10" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-40 rounded bg-white/10" />
          <div className="h-3 w-24 rounded bg-white/5" />
        </div>
        <div className="flex gap-1.5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 w-12 rounded-lg bg-white/5" />
          ))}
        </div>
      </div>
    </li>
  )
}

const CATEGORIES = ['All', 'C1', 'C2', 'C3'] as const
type Filter = (typeof CATEGORIES)[number]

// ─── Inner component ──────────────────────────────────────────────────────────

function StandingsContent() {
  const searchParams = useSearchParams()
  const seriesId = searchParams.get('seriesId') ?? 'default'

  const [standings, setStandings] = useState<Standing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('All')
  const [showRounds, setShowRounds] = useState(false)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!seriesId) return
    setLoading(true)
    setError(null)
    fetch(`/api/standings/${seriesId}`)
      .then(res => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`)
        return res.json()
      })
      .then((data: Standing[]) => setStandings(data))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [seriesId])

  const filtered = filter === 'All' ? standings : standings.filter(s => s.category === filter)
  const hasRoundData = standings.some(s => s.round_details?.length)

  return (
    <div className="min-h-screen px-4 py-16" style={{ background: '#0A0A0A' }}>
      <div className="mx-auto max-w-3xl">

        {/* Header */}
        <div className="mb-10">
          <div className="text-xs font-semibold tracking-[0.15em] uppercase text-indigo-400 mb-3">
            Series Standings
          </div>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-white">Leaderboard</h1>
              <p className="mt-2 text-sm text-ravens-muted">
                Mondello Series · Updated after each round
              </p>
            </div>
            {hasRoundData && (
              <button
                onClick={() => setShowRounds(v => !v)}
                className="rounded-lg border border-ravens-border px-4 py-2 text-sm font-medium text-ravens-muted hover:text-white hover:border-white/30 transition-colors bg-transparent cursor-pointer"
              >
                {showRounds ? 'Hide' : 'Show'} round points
              </button>
            )}
          </div>
        </div>

        {/* Category filter */}
        <div
          className="mb-6 flex gap-1 rounded-xl p-1 w-fit"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        >
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className="rounded-lg px-5 py-1.5 text-sm font-medium transition-all cursor-pointer border-none"
              style={{
                background: filter === cat ? 'linear-gradient(135deg, #1E1A50, #2D2870)' : 'transparent',
                color: filter === cat ? '#ffffff' : 'rgba(255,255,255,0.4)',
                border: filter === cat ? '1px solid rgba(255,255,255,0.12)' : '1px solid transparent',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <ul className="space-y-2">
            {[...Array(6)].map((_, i) => <SkeletonRow key={i} />)}
          </ul>
        ) : error ? (
          <div
            className="rounded-xl border border-red-900/50 p-8 text-center text-sm text-red-400"
            style={{ background: 'rgba(200,16,46,0.08)' }}
          >
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="rounded-xl border border-dashed border-ravens-border px-6 py-20 text-center"
            style={{ background: 'rgba(22,22,22,1)' }}
          >
            <p className="text-3xl mb-3">🏁</p>
            <p className="font-semibold text-white mb-1">No results yet</p>
            <p className="text-sm text-ravens-muted">Check back after Round 1</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {filtered.map(s => (
              <StandingRow key={s.id} s={s} showRounds={showRounds} />
            ))}
          </ul>
        )}

        {!loading && !error && filtered.length > 0 && (
          <p className="mt-6 text-center text-xs text-ravens-muted">
            {filtered.length} rider{filtered.length !== 1 ? 's' : ''}
            {filter !== 'All' ? ` · ${filter}` : ''}
          </p>
        )}

      </div>
    </div>
  )
}

// ─── Page export ──────────────────────────────────────────────────────────────

export default function StandingsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#0A0A0A' }}>
        <p className="text-ravens-muted text-sm">Loading standings…</p>
      </div>
    }>
      <StandingsContent />
    </Suspense>
  )
}