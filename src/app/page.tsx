export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@supabase/supabase-js'

type Fixture = {
  id: string
  title: string
  date: string
  venue: string
  categories: string[]
  status: 'upcoming' | 'completed' | 'cancelled'
}

type Standing = {
  rank: number
  name: string
  team: string | null
  category: string
  total_points: number
  wins: number
}

type Series = {
  id: string
  name: string
  year: number
}

async function getData() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [{ data: fixtures }, { data: series }] = await Promise.all([
    supabase
      .from('fixtures')
      .select('id, title, date, venue, categories, status')
      .order('date', { ascending: true })
      .limit(7),
    supabase
      .from('series')
      .select('id, name, year')
      .order('year', { ascending: false })
      .limit(1)
      .single(),
  ])

  let standings: Standing[] = []
  if (series) {
    const { data } = await supabase
      .from('standings')
      .select('rank, name, team, category, total_points, wins')
      .eq('series_id', series.id)
      .order('rank')
      .limit(5)
    standings = data ?? []
  }

  return {
    fixtures: (fixtures ?? []) as Fixture[],
    series: series as Series | null,
    standings,
  }
}

function statusStyle(s: string) {
  if (s === 'upcoming') return 'bg-green-900/30 text-green-400'
  if (s === 'completed') return 'bg-white/5 text-ravens-muted'
  return 'bg-red-900/30 text-red-400'
}

function statusLabel(s: string) {
  if (s === 'upcoming') return 'Upcoming'
  if (s === 'completed') return 'Completed'
  return 'Cancelled'
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IE', {
    day: 'numeric', month: 'short', year: 'numeric'
  })
}

function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString('en-IE', {
    hour: '2-digit', minute: '2-digit'
  })
}

const catColour: Record<string, string> = {
  C1: 'bg-violet-900/40 text-violet-300',
  C2: 'bg-sky-900/40 text-sky-300',
  C3: 'bg-emerald-900/40 text-emerald-300',
}

const rankMedal: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

export default async function HomePage() {
  const { fixtures, series, standings } = await getData()

  const completedFixtures = fixtures.filter(f => f.status === 'completed')

  const values = [
    { title: 'Competition', desc: 'Racing at Mondello and beyond, from C3 to elite category.' },
    { title: 'Community', desc: 'Club rides, social events, and lasting friendships on the road.' },
    { title: 'Development', desc: 'Supporting riders at every stage of their cycling journey.' },
    { title: 'Inclusion', desc: 'All levels welcome. Every ride, every race, every time.' },
  ]

  return (
    <div style={{ background: '#0A0A0A' }} className="text-white overflow-x-hidden">

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section
        className="min-h-screen flex flex-col justify-center items-center text-center px-6 pt-24 pb-16 relative overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #0A0A0A 0%, #1E1A50 35%, #1B1B4B 55%, #0A0A0A 100%)' }}
      >
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(30,26,80,0.35) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, #0A0A0A)' }} />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-block text-xs font-semibold tracking-[0.15em] uppercase text-ravens-muted border border-white/10 px-5 py-1.5 rounded-full mb-8">
            Est. 2025 · Dublin, Ireland · Cycling Ireland Affiliated
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold leading-none tracking-tight mb-6">
            Born to<br />
            <span style={{
              background: 'linear-gradient(135deg, #6860C0 0%, #8B85D0 50%, #FFFFFF 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              ride together
            </span>
          </h1>

          <p className="text-lg text-ravens-muted leading-relaxed max-w-xl mx-auto mb-10">
            From Mondello circuit racing to Sunday morning spins through the Dublin and Wicklow mountains.
            A community of passionate cyclists dedicated to the road.
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/kit"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-ravens-dark font-semibold rounded-lg text-sm no-underline hover:-translate-y-0.5 transition-transform">
              Order Kit →
            </Link>
            <Link href="/fixtures"
              className="inline-flex items-center gap-2 px-8 py-3.5 border border-white/20 text-white font-semibold rounded-lg text-sm no-underline hover:border-white/50 hover:bg-white/5 transition-all">
              {series ? series.name : 'Mondello Series 2026'}
            </Link>
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ───────────────────────────────────────────── */}
      <div className="border-y border-white/6 py-12 px-6" style={{ background: '#0A0A0A' }}>
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { n: String(fixtures.length || 7), label: 'Mondello Rounds' },
            { n: '120+', label: 'Registered Riders' },
            { n: '3', label: 'Sponsors & Partners' },
            { n: '52', label: 'Club Rides / Year' },
          ].map(s => (
            <div key={s.label}>
              <div className="text-4xl font-bold mb-1" style={{
                background: 'linear-gradient(135deg, #8B85D0, #FFFFFF)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>{s.n}</div>
              <div className="text-xs uppercase tracking-widest text-ravens-muted">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── ABOUT ─────────────────────────────────────────────────── */}
      <section id="about" className="py-24 px-6" style={{ background: '#0A0A0A' }}>
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="text-xs font-semibold tracking-[0.15em] uppercase text-indigo-400 mb-4">About DRRC</div>
              <h2 className="text-4xl font-bold tracking-tight leading-tight mb-6">
                Racing heritage.<br />Community spirit.
              </h2>
              <p className="text-ravens-muted leading-relaxed mb-8">
                Whether you&apos;re a seasoned racer pinning on numbers at Mondello or a weekend rider
                exploring the Dublin and Wicklow Mountains, DRRC welcomes all skill levels. We foster
                camaraderie, fitness, and adventure through regular group rides, competitive events,
                and a shared love for cycling.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {values.map(v => (
                  <div key={v.title} className="p-4 bg-ravens-surface border border-ravens-border rounded-xl">
                    <h4 className="font-semibold mb-1 text-sm">{v.title}</h4>
                    <p className="text-ravens-muted text-xs leading-relaxed">{v.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="aspect-[4/3] rounded-xl overflow-hidden border border-white/6 bg-ravens-surface flex items-center justify-center">
              <p className="text-ravens-muted text-sm text-center px-6">
                Photo: Sean Rowe Images
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SERIES DIVIDER ────────────────────────────────────────── */}
      <div className="h-52 flex items-center justify-center text-center relative overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #0A0A0A 0%, #1E1A50 40%, #1B1B4B 60%, #0A0A0A 100%)' }}>
        <div className="relative z-10 px-6">
          <h2 className="text-3xl font-bold mb-2">The Mondello Series</h2>
          <p className="text-ravens-muted">
            Thorntons Recycling Perpetual Cup · {fixtures.length || 7} Rounds · Cycling Ireland Points
          </p>
        </div>
      </div>

      {/* ── RACE CALENDAR ─────────────────────────────────────────── */}
      <section id="series" className="py-24 px-6" style={{ background: '#0A0A0A' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-xs font-semibold tracking-[0.15em] uppercase text-indigo-400 mb-3">
            {series ? `${series.year} Race Calendar` : '2026 Race Calendar'}
          </div>
          <h2 className="text-4xl font-bold tracking-tight mb-3">Race under the lights</h2>
          <p className="text-ravens-muted mb-10 max-w-xl">
            1 hour + 3 laps. Primes at 20 and 40 minutes. Cash prizes, Cycling Ireland points,
            and the Perpetual Trophy for the overall Series champion.
          </p>

          {fixtures.length === 0 ? (
            <div className="bg-ravens-surface border border-ravens-border rounded-xl p-10 text-center text-ravens-muted">
              No fixtures scheduled yet — check back soon.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {fixtures.map((f) => (
                <div key={f.id}
                  className="bg-ravens-surface border border-ravens-border rounded-xl p-5 hover:border-indigo-800/50 hover:-translate-y-1 transition-all group relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: 'linear-gradient(135deg, #1E1A50, #8B85D0)' }} />
                  <div className="text-xs font-semibold tracking-widest uppercase text-indigo-400 mb-2">
                    {f.title}
                  </div>
                  <div className="text-xl font-bold mb-1">{fmtDate(f.date)}</div>
                  <p className="text-ravens-muted text-sm mb-4">
                    {f.venue} · {fmtTime(f.date)}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1.5 flex-wrap">
                      {(f.categories ?? []).map(c => (
                        <span key={c} className={`text-xs font-semibold px-2 py-0.5 rounded ${catColour[c] ?? 'bg-white/5 text-ravens-muted'}`}>
                          {c}
                        </span>
                      ))}
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide ${statusStyle(f.status)}`}>
                      {statusLabel(f.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-4 mt-10 justify-center flex-wrap">
            <Link href="/fixtures"
              className="inline-flex items-center gap-2 px-6 py-3 border border-white/20 text-white font-semibold rounded-lg text-sm no-underline hover:border-white/50 hover:bg-white/5 transition-all">
              Full schedule & registration →
            </Link>
            {completedFixtures.length > 0 && (
              <Link href="/standings"
                className="inline-flex items-center gap-2 px-6 py-3 border border-white/20 text-white font-semibold rounded-lg text-sm no-underline hover:border-white/50 hover:bg-white/5 transition-all">
                View standings →
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ── STANDINGS PREVIEW ─────────────────────────────────────── */}
      {standings.length > 0 && series && (
        <section className="py-20 px-6 border-t border-white/6" style={{ background: '#18182A' }}>
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
              <div>
                <div className="text-xs font-semibold tracking-[0.15em] uppercase text-indigo-400 mb-2">
                  Series Standings
                </div>
                <h2 className="text-3xl font-bold">{series.name}</h2>
              </div>
              <Link href={`/standings?seriesId=${series.id}`}
                className="text-sm text-ravens-muted hover:text-white transition-colors no-underline">
                Full leaderboard →
              </Link>
            </div>
            <div className="space-y-2">
              {standings.map((s) => (
                <div key={s.rank}
                  className="bg-ravens-surface border border-ravens-border rounded-xl px-4 py-3 flex items-center gap-4">
                  <div className="w-8 text-center text-lg shrink-0">
                    {rankMedal[s.rank] ?? <span className="text-sm font-bold text-ravens-muted">{s.rank}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{s.name}</p>
                    {s.team && <p className="text-ravens-muted text-xs truncate">{s.team}</p>}
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded shrink-0 ${catColour[s.category] ?? 'bg-white/5 text-ravens-muted'}`}>
                    {s.category}
                  </span>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-sm">{s.total_points} pts</div>
                    <div className="text-xs text-ravens-muted">{s.wins} win{s.wins !== 1 ? 's' : ''}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 text-center">
              <Link href={`/standings?seriesId=${series.id}`}
                className="inline-flex items-center gap-2 px-6 py-3 border border-white/20 text-white font-semibold rounded-lg text-sm no-underline hover:border-white/50 hover:bg-white/5 transition-all">
                See full standings →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── KIT SECTION ───────────────────────────────────────────── */}
      <section id="kit" className="py-24 px-6 text-center relative overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #0A0A0A 0%, #1E1A50 30%, #1B1B4B 50%, #1E1A50 70%, #0A0A0A 100%)' }}>
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="text-xs font-semibold tracking-[0.15em] uppercase text-indigo-400 mb-4">Club Kit</div>
          <h2 className="text-4xl font-bold tracking-tight mb-4">Wear the Ravens</h2>
          <p className="text-ravens-muted leading-relaxed mb-12 max-w-xl mx-auto">
            Custom Gobik kit. Designed for performance. Built for the road.
            Order during the open window — made to order.
          </p>
          <div className="flex justify-center gap-8 mb-12 flex-wrap items-end">
            {[
              { src: '/kit/jersey-short-sleeve-front.png', label: 'CX UNI Jersey', desc: 'Short Sleeve' },
              { src: '/kit/jersey-sleeveless-front.png', label: 'Plus Vest', desc: 'Sleeveless' },
              { src: '/kit/jersey-bib-combo.png', label: 'Full Kit', desc: 'Jersey & Bibs' },
            ].map(item => (
              <Link key={item.label} href="/kit"
                className="group flex flex-col items-center gap-3 no-underline">
                <div className="relative w-48 h-64 rounded-xl overflow-hidden border border-white/10 bg-black/40 backdrop-blur-sm group-hover:border-indigo-500/50 group-hover:-translate-y-2 transition-all">
                  <Image src={item.src} alt={item.label} fill className="object-contain p-2" />
                </div>
                <div className="text-center">
                  <p className="text-white font-semibold text-sm">{item.label}</p>
                  <p className="text-ravens-muted text-xs">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
          <Link href="/kit"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-ravens-dark font-semibold rounded-lg text-sm no-underline hover:-translate-y-0.5 transition-transform">
            Pre-order kit →
          </Link>
        </div>
      </section>

      {/* ── SPONSORS ──────────────────────────────────────────────── */}
      <section id="sponsors" className="py-16 px-6 border-t border-white/6" style={{ background: '#0A0A0A' }}>
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs tracking-[0.15em] uppercase text-ravens-muted mb-8">Proudly supported by</p>
          <div className="flex justify-center gap-6 flex-wrap">
            {[
              { name: 'Stickybottle', href: 'https://www.stickybottle.com/' },
              { name: 'BikeWorx', href: 'https://bikeworx.ie/' },
              { name: 'Thorntons Recycling', href: 'https://www.thorntons-recycling.ie/' },
            ].map(s => (
              <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer"
                className="h-14 px-6 bg-white/4 border border-white/6 rounded-xl flex items-center justify-center text-ravens-muted text-sm font-medium hover:bg-white/8 hover:border-white/12 hover:-translate-y-0.5 transition-all no-underline">
                {s.name}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── THORNTONS PROMO ───────────────────────────────────────── */}
      <div className="py-16 px-6 border-t border-white/4" style={{ background: '#18182A' }}>
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-10">
          <div className="w-full md:w-64 aspect-square rounded-2xl border border-white/8 bg-ravens-surface flex items-center justify-center shrink-0">
            <span className="text-ravens-muted text-sm text-center px-4">Thorntons Recycling</span>
          </div>
          <div>
            <div className="text-xs font-semibold tracking-[0.15em] uppercase text-indigo-400 mb-3">Exclusive Partner Offer</div>
            <h3 className="text-3xl font-bold mb-4">Switch to Thorntons Recycling</h3>
            <p className="text-ravens-muted leading-relaxed mb-6">
              Use the code below when you switch and you&apos;ll receive €25 credit.
              Thorntons will also donate €25 to Dublin Ravens Road Club.
            </p>
            <div className="inline-block bg-indigo-900/30 border border-indigo-700 px-5 py-2.5 rounded-lg font-bold text-lg tracking-wider">
              RAVENS25
            </div>
          </div>
        </div>
      </div>

      {/* ── CTA BAND ──────────────────────────────────────────────── */}
      <section className="py-20 px-6 text-center relative overflow-hidden"
        style={{ background: '#1E1A50' }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 30% 50%, rgba(27,27,75,0.6), transparent 60%), radial-gradient(ellipse at 70% 50%, rgba(10,10,10,0.4), transparent 60%)' }} />
        <div className="relative z-10 max-w-xl mx-auto">
          <h2 className="text-4xl font-bold mb-4">Ready to ride?</h2>
          <p className="text-white/65 text-lg leading-relaxed mb-8">
            Join Dublin Ravens Road Club today. From your first group spin to racing at
            Mondello — there&apos;s a place for you here.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/kit"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-ravens-dark font-semibold rounded-lg text-sm no-underline hover:-translate-y-0.5 transition-transform">
              Order Kit →
            </Link>
            <Link href="/fixtures"
              className="inline-flex items-center gap-2 px-8 py-3.5 border border-white/30 text-white font-semibold rounded-lg text-sm no-underline hover:border-white/60 hover:bg-white/5 transition-all">
              View fixtures
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
