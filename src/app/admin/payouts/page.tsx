"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from '@supabase/supabase-js'
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

type PayoutStatus = "pending" | "sent" | "claimed" | "failed";

interface Rider {
  id: string;
  name: string;
  team: string | null;
  category: string | null;
  email: string | null;
}

interface Fixture {
  id: string;
  title: string;
  date: string;
  venue: string | null;
}

interface Result {
  id: string;
  fixture_id: string;
  rider_id: string;
  position: number | null;
  is_first_lady: boolean;
  is_first_junior: boolean;
  prime_won: string | null;
  points_earned: number;
  prize_amount: number;
  payout_status: PayoutStatus;
  payout_batch_id: string | null;
  // joined
  riders?: Rider|Rider[];
}

interface FixtureGroup {
  fixture: Fixture;
  results: Result[];
}

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_STYLES: Record<PayoutStatus, string> = {
  pending:  "bg-yellow-100 text-yellow-800 border-yellow-300",
  sent:     "bg-blue-100  text-blue-800  border-blue-300",
  claimed:  "bg-green-100 text-green-800 border-green-300",
  failed:   "bg-red-100   text-red-800   border-red-300",
};

const STATUS_DOT: Record<PayoutStatus, string> = {
  pending: "bg-yellow-400",
  sent:    "bg-blue-400",
  claimed: "bg-green-400",
  failed:  "bg-red-500",
};

function StatusBadge({ status }: { status: PayoutStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLES[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[status]}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ─── Category flags ───────────────────────────────────────────────────────────

function CategoryFlags({ result }: { result: Result }) {
  const flags: string[] = [];
  if (result.is_first_lady)   flags.push("🏅 First Lady");
  if (result.is_first_junior) flags.push("🏅 First Junior");
  if (result.prime_won)       flags.push(`⚡ ${result.prime_won}`);
  if (!flags.length) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-0.5">
      {flags.map(f => (
        <span key={f} className="text-xs bg-purple-50 text-purple-700 border border-purple-200 rounded px-1.5 py-0.5">
          {f}
        </span>
      ))}
    </div>
  );
}

// ─── Summary bar ──────────────────────────────────────────────────────────────

function FixtureSummary({ results }: { results: Result[] }) {
  const counts = results.reduce((acc, r) => {
    acc[r.payout_status] = (acc[r.payout_status] ?? 0) + 1;
    return acc;
  }, {} as Record<PayoutStatus, number>);

  const total = results.reduce((s, r) => s + (r.prize_amount ?? 0), 0);
  const failedTotal = results
    .filter(r => r.payout_status === "failed")
    .reduce((s, r) => s + (r.prize_amount ?? 0), 0);

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
      {(["pending","sent","claimed","failed"] as PayoutStatus[]).map(s =>
        counts[s] ? (
          <span key={s} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-medium ${STATUS_STYLES[s]}`}>
            {counts[s]} {s}
          </span>
        ) : null
      )}
      <span className="ml-auto font-semibold text-gray-800">
        Total prize pool: £{total.toFixed(2)}
      </span>
      {failedTotal > 0 && (
        <span className="text-red-600 font-semibold">
          ⚠ £{failedTotal.toFixed(2)} failed
        </span>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PayoutsPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router   = useRouter();

  const [groups,    setGroups]    = useState<FixtureGroup[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [expanded,  setExpanded]  = useState<Set<string>>(new Set());
  const [filter,    setFilter]    = useState<PayoutStatus | "all">("all");
  const [onlyFailed, setOnlyFailed] = useState(false);

  // ── Auth guard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace("/login");
    });
  }, [supabase, router]);

  // ── Fetch ───────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    // 1. Pull all placed results (position not null) + special category winners,
    //    joined with riders for display names.
    const { data: results, error: resErr } = await supabase
      .from("results")
      .select(`
        id, fixture_id, rider_id, position,
        is_first_lady, is_first_junior, prime_won,
        points_earned, prize_amount, payout_status, payout_batch_id,
        riders ( id, name, team, category, email )
      `)
      .not("prize_amount", "is", null)
      .order("fixture_id")
      .order("position", { ascending: true, nullsFirst: false });

    if (resErr) { setError(resErr.message); setLoading(false); return; }

    // 2. Pull fixture metadata for every fixture_id we have results for.
    const fixtureIds = [...new Set((results ?? []).map(r => r.fixture_id))];

    const { data: fixtures, error: fixErr } = await supabase
      .from("fixtures")
      .select("id, title, date, venue")
      .in("id", fixtureIds)
      .order("date", { ascending: false });

    if (fixErr) { setError(fixErr.message); setLoading(false); return; }

    // 3. Group results by fixture.
    const grouped: FixtureGroup[] = (fixtures ?? []).map(fixture => ({
      fixture,
      results: (results ?? []).filter(r => r.fixture_id === fixture.id),
    }));

    setGroups(grouped);

    // Auto-expand fixtures that have failures.
    const failedFixtures = grouped
      .filter(g => g.results.some(r => r.payout_status === "failed"))
      .map(g => g.fixture.id);
    setExpanded(prev => new Set([...prev, ...failedFixtures]));

    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Toggle expand ────────────────────────────────────────────────────────────
const toggleExpand = (id: string) =>
  setExpanded(prev => {
    const next = new Set(prev);
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    return next;
  });
  // ── Filtered view ────────────────────────────────────────────────────────────
  const visibleGroups = groups
    .map(g => ({
      ...g,
      results: g.results.filter(r =>
        (filter === "all" || r.payout_status === filter) &&
        (!onlyFailed || r.payout_status === "failed")
      ),
    }))
    .filter(g => g.results.length > 0);

  // ─────────────────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen text-gray-500">
      Loading payouts…
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-screen text-red-600">
      Error: {error}
    </div>
  );

  const totalFailed = groups.flatMap(g => g.results).filter(r => r.payout_status === "failed").length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payouts</h1>
          <p className="text-sm text-gray-500 mt-0.5">Per-fixture prize payout status</p>
        </div>
        <button
          onClick={fetchData}
          className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
        >
          ↻ Refresh
        </button>
      </div>

      {/* ── Failed alert banner ── */}
      {totalFailed > 0 && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
          <span className="text-red-500 text-xl leading-none">⚠</span>
          <div>
            <p className="font-semibold text-red-800">
              {totalFailed} payout{totalFailed !== 1 ? "s" : ""} failed — manual action required
            </p>
            <p className="text-sm text-red-600 mt-0.5">
              Review the entries marked <strong>Failed</strong> below and re-process via PayPal or contact the rider directly.
            </p>
          </div>
          <button
            onClick={() => { setOnlyFailed(true); setFilter("all"); }}
            className="ml-auto text-xs px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition whitespace-nowrap"
          >
            Show failed only
          </button>
        </div>
      )}

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm text-gray-600 font-medium">Filter by status:</span>
        {(["all", "pending", "sent", "claimed", "failed"] as const).map(s => (
          <button
            key={s}
            onClick={() => { setFilter(s); setOnlyFailed(false); }}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition ${
              filter === s && !onlyFailed
                ? "bg-gray-800 text-white border-gray-800"
                : "bg-white text-gray-600 border-gray-300 hover:border-gray-500"
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
        {onlyFailed && (
          <button
            onClick={() => setOnlyFailed(false)}
            className="text-xs px-3 py-1.5 rounded-full border font-medium bg-red-600 text-white border-red-600"
          >
            ✕ Clear &quot;Failed only&quot;
          </button>
        )}
      </div>

      {/* ── Fixture groups ── */}
      {visibleGroups.length === 0 ? (
        <p className="text-gray-500 text-center py-16">No results match the current filter.</p>
      ) : (
        visibleGroups.map(({ fixture, results }) => {
          const isOpen = expanded.has(fixture.id);
          const hasFailed = results.some(r => r.payout_status === "failed");

          return (
            <div
              key={fixture.id}
              className={`border rounded-xl overflow-hidden shadow-sm ${
                hasFailed ? "border-red-300" : "border-gray-200"
              }`}
            >
              {/* Fixture header */}
              <button
                onClick={() => toggleExpand(fixture.id)}
                className={`w-full flex items-center justify-between px-5 py-4 text-left transition ${
                  hasFailed ? "bg-red-50 hover:bg-red-100" : "bg-gray-50 hover:bg-gray-100"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {hasFailed && <span className="text-red-500">⚠</span>}
                    <h2 className="font-semibold text-gray-900">{fixture.title}</h2>
                    <span className="text-xs text-gray-500">
                      {new Date(fixture.date).toLocaleDateString("en-GB", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </span>
                    {fixture.venue && (
                      <span className="text-xs text-gray-400">· {fixture.venue}</span>
                    )}
                  </div>
                  <FixtureSummary results={results} />
                </div>
                <span className="text-gray-400 text-lg ml-4">{isOpen ? "▲" : "▼"}</span>
              </button>

              {/* Results table */}
              {isOpen && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-white border-b border-gray-100 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <th className="px-5 py-3">Pos</th>
                        <th className="px-5 py-3">Rider</th>
                        <th className="px-5 py-3">Category</th>
                        <th className="px-5 py-3">Points</th>
                        <th className="px-5 py-3">Prize</th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3">Batch ID</th>
                        <th className="px-5 py-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {results.map(r => (
                        <tr
                          key={r.id}
                          className={`hover:bg-gray-50 transition ${
                            r.payout_status === "failed" ? "bg-red-50 hover:bg-red-100" : ""
                          }`}
                        >
                          {/* Position */}
                          <td className="px-5 py-3 font-mono font-bold text-gray-700">
                            {r.position ?? "—"}
                          </td>

                          {/* Rider */}
                          <td className="px-5 py-3">
                            <div className="font-medium text-gray-900">
                              {(r.riders as Rider | undefined)?.name ?? r.rider_id}
                            </div>
                            <div className="flex gap-1.5 mt-0.5 flex-wrap">
                              {(r.riders as Rider | undefined)?.category && (
                                <span className="text-xs bg-gray-100 text-gray-600 border border-gray-200 rounded px-1.5 py-0.5">
                                  {(r.riders as Rider).category}
                                </span>
                              )}
                              {(r.riders as Rider | undefined)?.team && (
                                <span className="text-xs text-gray-400">
                                  {(r.riders as Rider).team}
                                </span>
                              )}
                            </div>
                            <CategoryFlags result={r} />
                          </td>

                          {/* Category flags summary */}
                          <td className="px-5 py-3 text-gray-500 text-xs">
                            {[
                              r.is_first_lady   && "Lady",
                              r.is_first_junior && "Junior",
                              r.prime_won       && `Prime`,
                            ].filter(Boolean).join(", ") || "—"}
                          </td>

                          {/* Points */}
                          <td className="px-5 py-3 font-mono text-gray-700">
                            {r.points_earned ?? "—"}
                          </td>

                          {/* Prize */}
                          <td className="px-5 py-3 font-semibold text-gray-800">
                            £{(r.prize_amount ?? 0).toFixed(2)}
                          </td>

                          {/* Status */}
                          <td className="px-5 py-3">
                            <StatusBadge status={r.payout_status} />
                          </td>

                          {/* Batch ID */}
                          <td className="px-5 py-3 font-mono text-xs text-gray-500 max-w-[140px] truncate">
                            {r.payout_batch_id
                              ? <span title={r.payout_batch_id}>{r.payout_batch_id}</span>
                              : <span className="text-gray-300">—</span>
                            }
                          </td>

                          {/* Action */}
                          <td className="px-5 py-3">
                            {r.payout_status === "failed" && (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-100 border border-red-200 rounded px-2 py-1">
                                🚩 Manual action needed
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
