export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

type Fixture = {
  id: string
  title: string
  date: string
  venue: string
  categories: string[]
  status: 'upcoming' | 'completed' | 'cancelled'
}

async function getFixtures(): Promise<Fixture[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data, error } = await supabase
    .from('fixtures')
    .select('id, title, date, venue, categories, status')
    .order('date', { ascending: true })
  if (error) return []
  return data || []
}

function fmtDay(d: string) {
  return new Date(d).getDate()
}
function fmtMonth(d: string) {
  return new Date(d).toLocaleString('en-IE', { month: 'short' }).toUpperCase()
}
function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' })
}
function fmtFullDate(d: string) {
  return new Date(d).toLocaleDateString('en-IE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })
}

const catColour: Record<string, string> = {
  C1: 'bg-violet-900/40 text-violet-300',
  C2: 'bg-sky-900/40 text-sky-300',
  C3: 'bg-emerald-900/40 text-emerald-300',
}

const statusConfig = {
  upcoming: { label: 'Upcoming', style: 'bg-green-900/30 text-green-400 border border-green-800/40' },
  completed: { label: 'Completed', style: 'bg-white/5 text-ravens-muted border border-white/10' },
  cancelled: { label: 'Cancelled', style: 'bg-red-900/30 text-red-400 border border-red-800/40' },
}

export default async function FixturesPage() {
  const fixtures = await getFixtures()

  const upcoming = fixtures.filter(f => f.status === 'upcoming')
  const completed = fixtures.filter(f => f.status === 'completed')
  const cancelled = fixtures.filter(f => f.status === 'cancelled')

  return (
    <div className="min-h-screen" style={{ background: '#0A0A0A' }}>
      <div className="max-w-3xl mx-auto px-6 py-16">

        {/* Header */}
        <div className="mb-12">
          <div className="text-xs font-semibold tracking-[0.15em] uppercase text-indigo-400 mb-3">
            2026 Race Calendar
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white mb-3">
            Race Fixtures
          </h1>
          <p className="text-ravens-muted">
            Mondello Park · 1 hour + 3 laps · C1, C2, C3
          </p>
        </div>

        {fixtures.length === 0 ? (
          <div className="bg-ravens-surface border border-ravens-border rounded-xl p-12 text-center">
            <p className="text-3xl mb-3">🏁</p>
            <p className="text-white font-semibold mb-1">No fixtures yet</p>
            <p className="text-ravens-muted text-sm">Check back soon for the 2026 schedule.</p>
          </div>
        ) : (
          <div className="space-y-10">

            {/* Upcoming */}
            {upcoming.length > 0 && (
              <div>
                <h2 className="text-xs font-semibold tracking-[0.15em] uppercase text-indigo-400 mb-4">
                  Upcoming
                </h2>
                <div className="space-y-3">
                  {upcoming.map(f => (
                    <FixtureCard key={f.id} fixture={f} />
                  ))}
                </div>
              </div>
            )}

            {/* Completed */}
            {completed.length > 0 && (
              <div>
                <h2 className="text-xs font-semibold tracking-[0.15em] uppercase text-ravens-muted mb-4">
                  Completed
                </h2>
                <div className="space-y-3">
                  {completed.map(f => (
                    <FixtureCard key={f.id} fixture={f} />
                  ))}
                </div>
              </div>
            )}

            {/* Cancelled */}
            {cancelled.length > 0 && (
              <div>
                <h2 className="text-xs font-semibold tracking-[0.15em] uppercase text-ravens-muted mb-4">
                  Cancelled
                </h2>
                <div className="space-y-3">
                  {cancelled.map(f => (
                    <FixtureCard key={f.id} fixture={f} />
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  )
}

function FixtureCard({ fixture }: { fixture: Fixture }) {
  const sc = statusConfig[fixture.status]

  return (
    <div className="bg-ravens-surface border border-ravens-border rounded-xl px-5 py-4 flex items-center gap-5 group hover:border-indigo-800/50 transition-colors relative overflow-hidden">
      <div
        className="absolute top-0 left-0 bottom-0 w-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: 'linear-gradient(to bottom, #1E1A50, #8B85D0)' }}
      />

      {/* Date block */}
      <div className="text-center min-w-[44px] shrink-0">
        <div
          className="text-2xl font-extrabold leading-none"
          style={{
            background: 'linear-gradient(135deg, #8B85D0, #FFFFFF)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {fmtDay(fixture.date)}
        </div>
        <div className="text-ravens-muted text-[10px] font-semibold tracking-widest mt-0.5">
          {fmtMonth(fixture.date)}
        </div>
      </div>

      {/* Divider */}
      <div className="w-px self-stretch bg-ravens-border shrink-0" />

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1.5">
          <span className="text-white font-semibold text-sm">{fixture.title}</span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${sc.style}`}>
            {sc.label}
          </span>
        </div>
        <div className="flex flex-wrap gap-3 text-ravens-muted text-xs">
          <span>📍 {fixture.venue}</span>
          <span>🕐 {fmtTime(fixture.date)}</span>
          <span className="hidden sm:inline">📅 {fmtFullDate(fixture.date)}</span>
        </div>
        <div className="flex gap-1.5 mt-2 flex-wrap">
          {(fixture.categories ?? []).map(c => (
            <span key={c} className={`text-xs font-semibold px-2 py-0.5 rounded ${catColour[c] ?? 'bg-white/5 text-ravens-muted'}`}>
              {c}
            </span>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="shrink-0">
        {fixture.status === 'upcoming' && (
          
            <a ref="https://eventmaster.ie"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 no-underline text-xs font-semibold px-4 py-2 rounded-lg transition-all"
            style={{
              background: 'linear-gradient(135deg, #1E1A50, #2D2870)',
              color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            Register →
          </a>
        )}
        {fixture.status === 'completed' && (
          <Link
            href="/standings"
            className="inline-flex items-center gap-1.5 no-underline text-xs font-semibold px-4 py-2 rounded-lg border border-ravens-border text-ravens-muted hover:text-white hover:border-white/30 transition-colors"
          >
            Results →
          </Link>
        )}
      </div>
    </div>
  )
}