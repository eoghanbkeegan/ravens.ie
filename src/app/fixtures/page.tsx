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

export default async function FixturesPage() {
  const fixtures = await getFixtures()

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-white mb-2">Race Fixtures</h1>
      <p className="text-ravens-muted mb-8">2026 Mondello Series</p>

      {fixtures.length === 0 ? (
        <div className="bg-ravens-surface border border-ravens-border rounded-lg p-8 text-center">
          <p className="text-ravens-muted">No fixtures scheduled yet — check back soon.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {fixtures.map((fixture) => (
            <div
              key={fixture.id}
              className="bg-ravens-surface border border-ravens-border rounded-lg px-5 py-4 flex items-center justify-between gap-4"
            >
              {/* Date */}
              <div className="text-center min-w-[48px]">
                <div className="text-ravens-red font-bold text-lg leading-none">
                  {new Date(fixture.date).getDate()}
                </div>
                <div className="text-ravens-muted text-xs uppercase tracking-wider">
                  {new Date(fixture.date).toLocaleString('en-IE', { month: 'short' })}
                </div>
              </div>

              {/* Divider */}
              <div className="w-px h-10 bg-ravens-border" />

              {/* Details */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-semibold text-sm">{fixture.title}</span>
                  <StatusBadge status={fixture.status} />
                </div>
                <div className="flex gap-3 text-ravens-muted text-xs">
                  <span>📍 {fixture.venue}</span>
                  <span>🏷️ {fixture.categories.join(', ')}</span>
                </div>
              </div>

              {/* CTA */}
              {fixture.status === 'upcoming' && (
                
                <a  href="https://eventmaster.ie"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-ravens-red text-white text-xs font-semibold px-4 py-2 rounded-md no-underline hover:opacity-90 transition-opacity whitespace-nowrap"
                >
                  Register
                </a>
              )}
              {fixture.status === 'completed' && (
                <Link
                  href={`/standings`}
                  className="border border-ravens-border text-ravens-muted text-xs font-semibold px-4 py-2 rounded-md no-underline hover:text-white hover:border-white transition-colors whitespace-nowrap"
                >
                  Results
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: Fixture['status'] }) {
  const styles = {
    upcoming: 'bg-blue-900/50 text-blue-300 border border-blue-800',
    completed: 'bg-green-900/50 text-green-300 border border-green-800',
    cancelled: 'bg-red-900/50 text-red-300 border border-red-800',
  }
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider ${styles[status]}`}>
      {status}
    </span>
  )
}