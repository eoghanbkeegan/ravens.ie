'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

// ⚠️ Must be outside component — prevents re-render loop
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type PayoutStatus = 'pending' | 'sent' | 'claimed' | 'failed' | 'not_initiated'

interface Rider {
  id: string
  name: string
  team: string | null
  category: string | null
  email: string | null
}

interface Fixture {
  id: string
  title: string
  date: string
  venue: string | null
}

interface Result {
  id: string
  fixture_id: string
  rider_id: string
  position: number | null
  is_first_lady: boolean
  is_first_junior: boolean
  prime_won: string | null
  points_earned: number
  prize_amount: number
  payout_status: PayoutStatus
  payout_batch_id: string | null
  riders?: Rider | Rider[]
}

interface FixtureGroup {
  fixture: Fixture
  results: Result[]
}

const STATUS_STYLE: Record<PayoutStatus, string> = {
  pending:       'bg-yellow-900/30 text-yellow-400 border border-yellow-800/40',
  sent:          'bg-blue-900/30 text-blue-400 border border-blue-800/40',
  claimed:       'bg-green-900/30 text-green-400 border border-green-800/40',
  failed:        'bg-red-900/30 text-red-400 border border-red-800/40',
  not_initiated: 'bg-white/5 text-ravens-muted border border-white/10',
}

function StatusBadge({ status }: { status: PayoutStatus }) {
  const style = STATUS_STYLE[status] ?? STATUS_STYLE.not_initiated
  const label = status.replace('_', ' ')
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style}`}>
      {label.charAt(0).toUpperCase() + label.slice(1)}
    </span>
  )
}

function FixtureSummary({ results }: { results: Result[] }) {
  const counts = results.reduce((acc, r) => {
    acc[r.payout_status] = (acc[r.payout_status] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)
  const total = results.reduce((s, r) => s + (r.prize_amount ?? 0), 0)
  const failedTotal = results.filter(r => r.payout_status === 'failed').reduce((s, r) => s + (r.prize_amount ?? 0), 0)

  return (
    <div className="flex flex-wrap items-center gap-2 mt-1">
      {(['pending', 'sent', 'claimed', 'failed', 'not_initiated'] as PayoutStatus[]).map(s =>
        counts[s] ? (
          <span key={s} className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLE[s]}`}>
            {counts[s]} {s.replace('_', ' ')}
          </span>
        ) : null
      )}
      <span className="ml-auto text-xs font-semibold text-white">€{total.toFixed(2)} total</span>
      {failedTotal > 0 && <span className="text-xs font-semibold text-red-400">⚠ €{failedTotal.toFixed(2)} failed</span>}
    </div>
  )
}

export default function PayoutsPage() {
  const [groups,     setGroups]     = useState<FixtureGroup[]>([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState<string | null>(null)
  const [expanded,   setExpanded]   = useState<Set<string>>(new Set())
  const [filter,     setFilter]     = useState<PayoutStatus | 'all'>('all')
  const [onlyFailed, setOnlyFailed] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data: results, error: resErr } = await supabase
      .from('results')
      .select(`
        id, fixture_id, rider_id, position,
        is_first_lady, is_first_junior, prime_won,
        points_earned, prize_amount, payout_status, payout_batch_id,
        riders ( id, name, team, category, email )
      `)
      .not('prize_amount', 'is', null)
      .order('fixture_id')
      .order('position', { ascending: true, nullsFirst: false })

    if (resErr) { setError(resErr.message); setLoading(false); return }

    const fixtureIds = [...new Set((results ?? []).map(r => r.fixture_id))]
    if (fixtureIds.length === 0) { setGroups([]); setLoading(false); return }

    const { data: fixtures, error: fixErr } = await supabase
      .from('fixtures')
      .select('id, title, date, venue')
      .in('id', fixtureIds)
      .order('date', { ascending: false })

    if (fixErr) { setError(fixErr.message); setLoading(false); return }

    const grouped: FixtureGroup[] = (fixtures ?? []).map(fixture => ({
      fixture,
      results: (results ?? []).filter(r => r.fixture_id === fixture.id),
    }))

    setGroups(grouped)
    const failedIds = grouped.filter(g => g.results.some(r => r.payout_status === 'failed')).map(g => g.fixture.id)
    setExpanded(prev => new Set([...prev, ...failedIds]))
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const toggleExpand = (id: string) =>
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })

  const visibleGroups = groups
    .map(g => ({
      ...g,
      results: g.results.filter(r =>
        (filter === 'all' || r.payout_status === filter) &&
        (!onlyFailed || r.payout_status === 'failed')
      ),
    }))
    .filter(g => g.results.length > 0)

  const totalFailed = groups.flatMap(g => g.results).filter(r => r.payout_status === 'failed').length

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <p className="text-ravens-muted text-sm">Loading payouts…</p>
    </div>
  )

  if (error) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <p className="text-red-400 text-sm">Error: {error}</p>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-8">

      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold tracking-[0.15em] uppercase text-indigo-400 mb-2">Admin</div>
          <h1 className="text-3xl font-bold text-white">Payouts</h1>
          <p className="text-ravens-muted text-sm mt-1">Per-fixture prize payout status</p>
        </div>
        <button onClick={fetchData}
          className="text-sm px-4 py-2 border border-ravens-border rounded-lg text-ravens-muted hover:text-white hover:border-white/30 transition-colors bg-transparent cursor-pointer">
          ↻ Refresh
        </button>
      </div>

      {totalFailed > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-red-800/50 p-4" style={{ background: 'rgba(200,16,46,0.08)' }}>
          <span className="text-red-400 text-lg">⚠</span>
          <div className="flex-1">
            <p className="font-semibold text-red-400 text-sm">{totalFailed} payout{totalFailed !== 1 ? 's' : ''} failed — manual action required</p>
            <p className="text-red-400/70 text-xs mt-0.5">Review entries marked Failed and re-process via PayPal or contact the rider directly.</p>
          </div>
          <button onClick={() => { setOnlyFailed(true); setFilter('all') }}
            className="text-xs px-3 py-1.5 bg-red-700 text-white rounded-lg hover:bg-red-600 transition whitespace-nowrap cursor-pointer border-none">
            Show failed only
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-ravens-muted font-medium">Filter:</span>
        {(['all', 'pending', 'sent', 'claimed', 'failed', 'not_initiated'] as const).map(s => (
          <button key={s} onClick={() => { setFilter(s); setOnlyFailed(false) }}
            className="text-xs px-3 py-1.5 rounded-full border font-medium transition cursor-pointer"
            style={{
              background: filter === s && !onlyFailed ? 'linear-gradient(135deg, #1E1A50, #2D2870)' : 'transparent',
              color: filter === s && !onlyFailed ? '#ffffff' : 'rgba(255,255,255,0.4)',
              borderColor: filter === s && !onlyFailed ? 'rgba(255,255,255,0.12)' : 'rgba(37,37,37,1)',
            }}>
            {s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')}
          </button>
        ))}
        {onlyFailed && (
          <button onClick={() => setOnlyFailed(false)}
            className="text-xs px-3 py-1.5 rounded-full border font-medium bg-red-700 text-white border-red-700 cursor-pointer">
            ✕ Clear
          </button>
        )}
      </div>

      {visibleGroups.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-ravens-muted text-sm">No results match the current filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {visibleGroups.map(({ fixture, results }) => {
            const isOpen = expanded.has(fixture.id)
            const hasFailed = results.some(r => r.payout_status === 'failed')
            return (
              <div key={fixture.id} className="rounded-xl border overflow-hidden"
                style={{ borderColor: hasFailed ? 'rgba(200,16,46,0.4)' : 'rgba(37,37,37,1)', background: '#161616' }}>
                <button onClick={() => toggleExpand(fixture.id)}
                  className="w-full flex items-start justify-between px-5 py-4 text-left hover:bg-white/5 transition cursor-pointer border-none bg-transparent">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {hasFailed && <span className="text-red-400 text-sm">⚠</span>}
                      <h2 className="font-semibold text-white">{fixture.title}</h2>
                      <span className="text-xs text-ravens-muted">
                        {new Date(fixture.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <FixtureSummary results={results} />
                  </div>
                  <span className="text-ravens-muted ml-4 mt-1">{isOpen ? '▲' : '▼'}</span>
                </button>

                {isOpen && (
                  <div className="overflow-x-auto border-t border-ravens-border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs font-semibold text-ravens-muted uppercase tracking-wider border-b border-ravens-border">
                          <th className="px-5 py-3">Pos</th>
                          <th className="px-5 py-3">Rider</th>
                          <th className="px-5 py-3">Points</th>
                          <th className="px-5 py-3">Prize</th>
                          <th className="px-5 py-3">Status</th>
                          <th className="px-5 py-3">Batch ID</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-ravens-border">
                        {results.map(r => {
                          const rider = r.riders as Rider | undefined
                          return (
                            <tr key={r.id} className="hover:bg-white/5 transition"
                              style={r.payout_status === 'failed' ? { background: 'rgba(200,16,46,0.05)' } : {}}>
                              <td className="px-5 py-3 font-mono font-bold text-white">{r.position ?? '—'}</td>
                              <td className="px-5 py-3">
                                <div className="font-medium text-white">{rider?.name ?? r.rider_id}</div>
                                <div className="text-xs text-ravens-muted">{rider?.team ?? ''}</div>
                                {(r.is_first_lady || r.is_first_junior || r.prime_won) && (
                                  <div className="flex gap-1 mt-0.5 flex-wrap">
                                    {r.is_first_lady && <span className="text-xs bg-pink-900/30 text-pink-400 px-1.5 py-0.5 rounded">First Lady</span>}
                                    {r.is_first_junior && <span className="text-xs bg-purple-900/30 text-purple-400 px-1.5 py-0.5 rounded">First Junior</span>}
                                    {r.prime_won && <span className="text-xs bg-orange-900/30 text-orange-400 px-1.5 py-0.5 rounded">Prime</span>}
                                  </div>
                                )}
                              </td>
                              <td className="px-5 py-3 font-mono text-ravens-muted">{r.points_earned ?? '—'}</td>
                              <td className="px-5 py-3 font-semibold text-white">€{(r.prize_amount ?? 0).toFixed(2)}</td>
                              <td className="px-5 py-3"><StatusBadge status={r.payout_status} /></td>
                              <td className="px-5 py-3 font-mono text-xs text-ravens-muted max-w-[140px] truncate">
                                {r.payout_batch_id ?? <span className="opacity-30">—</span>}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}