import Link from 'next/link'

const adminSections = [
  {
    title: 'Fixtures',
    description: 'Create and manage race events, assign to series, update status.',
    href: '/admin/fixtures',
    icon: '📅',
  },
  {
    title: 'Riders',
    description: 'Import riders from Event Master CSV/Excel before each race.',
    href: '/admin/riders',
    icon: '🚴',
  },
  {
    title: 'Results',
    description: 'Enter race results, assign positions, publish and trigger payouts.',
    href: '/admin/results',
    icon: '🏁',
  },
  {
    title: 'Payouts',
    description: 'View payout status per fixture, flag failed payments.',
    href: '/admin/payouts',
    icon: '💸',
  },
  {
    title: 'Kit Shop',
    description: 'Manage kit products, stock levels and incoming orders.',
    href: '/admin/kit',
    icon: '🛍️',
  },
  {
    title: 'Series',
    description: 'Manage series and scoring templates.',
    href: '/admin/series',
    icon: '🏆',
  },
]

export default function AdminDashboard() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-ravens-red text-2xl">⚙️</span>
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
        </div>
        <p className="text-ravens-muted">
          Dublin Ravens Road Club — manage fixtures, riders, results and kit.
        </p>
      </div>

      {/* Race day quick actions */}
      <div className="bg-ravens-surface border border-ravens-red/30 rounded-xl p-5 mb-8">
        <h2 className="text-sm font-bold text-ravens-red uppercase tracking-wider mb-4">
          🚨 Race Day Flow
        </h2>
        <div className="flex flex-wrap gap-3">
          <QuickAction href="/admin/riders" label="1 — Import Riders" />
          <Arrow />
          <QuickAction href="/admin/results" label="2 — Enter Results" />
          <Arrow />
          <QuickAction href="/admin/payouts" label="3 — Check Payouts" />
        </div>
      </div>

      {/* Section grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {adminSections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="group bg-ravens-surface border border-ravens-border hover:border-ravens-red/50 rounded-xl p-5 no-underline transition-all hover:shadow-lg hover:shadow-ravens-red/10"
          >
            <div className="flex items-start gap-4">
              <span className="text-2xl">{section.icon}</span>
              <div>
                <h3 className="text-white font-semibold text-base mb-1 group-hover:text-ravens-red transition-colors">
                  {section.title}
                </h3>
                <p className="text-ravens-muted text-sm leading-relaxed">
                  {section.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Public pages */}
      <div className="mt-8 pt-6 border-t border-ravens-border">
        <p className="text-ravens-muted text-xs uppercase tracking-wider mb-3 font-semibold">
          Public pages
        </p>
        <div className="flex flex-wrap gap-3">
          <PublicLink href="/" label="Homepage" />
          <PublicLink href="/fixtures" label="Fixtures" />
          <PublicLink href="/standings" label="Standings" />
          <PublicLink href="/shop" label="Kit Shop" />
        </div>
      </div>
    </div>
  )
}

function QuickAction({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="bg-ravens-red/10 border border-ravens-red/30 text-ravens-red text-sm font-semibold px-4 py-2 rounded-lg no-underline hover:bg-ravens-red hover:text-white transition-all"
    >
      {label}
    </Link>
  )
}

function Arrow() {
  return <span className="text-ravens-muted self-center">→</span>
}

function PublicLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="text-ravens-muted text-sm no-underline hover:text-white border border-ravens-border hover:border-ravens-muted px-3 py-1.5 rounded-md transition-colors"
    >
      {label} ↗
    </Link>
  )
}