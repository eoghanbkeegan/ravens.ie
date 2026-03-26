"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Fixture = { id: string; name: string; date: string };
type Rider   = { id: string; name: string };

type ResultsFormState = {
  fixtureId: string;
  positions: (string | null)[];       // indices 0–5 → P1–P6, values are rider_id
  ladyInTop6: boolean | null;
  ladyPosition: number | null;        // 1–6 if ladyInTop6 = true
  firstLadyId: string | null;         // rider_id if ladyInTop6 = false
  firstJuniorId: string | null;
  juniorInTop6: boolean | null;
  firstC2Id: string | null;
  firstC3Id: string | null;
  prime1Id: string | null;
  prime2Id: string | null;
  primesInTop6: boolean | null;
  primesTop6Count: "prime1" | "prime2" | "both" | null;
  prime1Position: number | null;
  prime2Position: number | null;
};

const POSITION_COUNT = 6;

const emptyForm = (): ResultsFormState => ({
  fixtureId: "",
  positions: Array(POSITION_COUNT).fill(null),
  ladyInTop6: null, ladyPosition: null, firstLadyId: null,
  firstJuniorId: null, juniorInTop6: null,
  firstC2Id: null, firstC3Id: null,
  prime1Id: null, prime2Id: null,
  primesInTop6: null, primesTop6Count: null,
  prime1Position: null, prime2Position: null,
});

// ⚠️ TEMPORARY: hardcoded until Supabase fixtures table is ready
const HARDCODED_FIXTURES: Fixture[] = [
  { id: "1", name: "Round 1", date: "2025-04-29T19:30:00" },
  { id: "2", name: "Round 2", date: "2025-05-06T19:30:00" },
  { id: "3", name: "Round 3", date: "2025-05-27T19:30:00" },
  { id: "4", name: "Round 4", date: "2025-06-17T19:30:00" },
  { id: "5", name: "Round 5", date: "2025-07-29T19:30:00" },
  { id: "6", name: "Round 6", date: "2025-08-12T19:30:00" },
  { id: "7", name: "Round 7", date: "2025-08-19T19:00:00" },
];

function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString("en-GB", {
    weekday: "short", day: "numeric", month: "short",
  })}, ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
}

// ---------------------------------------------------------------------------
// Auth guard — ⚠️ ASSUMPTION: middleware blocks non-admins at /admin/*
// ---------------------------------------------------------------------------
export default function AdminResultsPage() {
  const supabase = createClient();

  const [fixtures]                        = useState<Fixture[]>(HARDCODED_FIXTURES);
  const [riders, setRiders]               = useState<Rider[]>([]);
  const [form, setForm]                   = useState<ResultsFormState>(emptyForm());
  const [loadingRiders, setLoadingRiders] = useState(false);
  const [publishing, setPublishing]       = useState(false);

  // -------------------------------------------------------------------------
  // Load riders on mount
  // ⚠️ ASSUMPTION: "riders" table with id, name columns
  // -------------------------------------------------------------------------
  useEffect(() => {
    async function load() {
      setLoadingRiders(true);
      const { data, error } = await supabase
        .from("riders")
        .select("id, name")
        .order("name");
      if (error) toast.error("Failed to load riders");
      else setRiders(data ?? []);
      setLoadingRiders(false);
    }
    load();
  }, []);

  // -------------------------------------------------------------------------
  // Derived state
  // -------------------------------------------------------------------------
  const allPositionsFilled = form.positions.every((p) => p !== null);
  const bothPrimesSelected = !!form.prime1Id && !!form.prime2Id;

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------
  function setPosition(i: number, v: string | null) {
    setForm((p) => {
      const next = [...p.positions];
      next[i] = v;
      return { ...p, positions: next };
    });
  }

  function unavailableForPosition(i: number): Set<string> {
    return new Set(
      form.positions.filter((id, j) => j !== i && id !== null) as string[]
    );
  }

  function riderName(id: string | null): string {
    if (!id) return "";
    return riders.find((r) => r.id === id)?.name ?? id;
  }

  // Derive the lady's rider_id regardless of whether she's in top 6.
  // route.ts handles the distinction via placedRiderIds server-side.
  function resolveLadyId(): string | undefined {
    if (form.ladyInTop6 === true && form.ladyPosition !== null) {
      return form.positions[form.ladyPosition - 1] ?? undefined;
    }
    if (form.ladyInTop6 === false && form.firstLadyId) {
      return form.firstLadyId;
    }
    return undefined;
  }

  // -------------------------------------------------------------------------
  // Validation
  // -------------------------------------------------------------------------
  function isFormValid(): boolean {
    if (!form.fixtureId || !form.positions[0] || !allPositionsFilled) return false;
    if (form.ladyInTop6 === null) return false;
    if (form.ladyInTop6 === true && !form.ladyPosition) return false;
    if (form.ladyInTop6 === false && !form.firstLadyId) return false;
    if (!form.firstJuniorId) return false;
    if (!form.prime1Id || !form.prime2Id) return false;
    if (form.primesInTop6 === null) return false;
    if (form.primesInTop6) {
      if (!form.primesTop6Count) return false;
      if (form.primesTop6Count === "prime1" && !form.prime1Position) return false;
      if (form.primesTop6Count === "prime2" && !form.prime2Position) return false;
      if (form.primesTop6Count === "both" && (!form.prime1Position || !form.prime2Position)) return false;
    }
    return true;
  }

  function statusHint(): string {
    if (!form.fixtureId)          return "Select a fixture to begin.";
    if (!form.positions[0])       return "P1 is required before publishing.";
    if (!allPositionsFilled)      return "Fill all 6 positions to continue.";
    if (form.ladyInTop6 === null) return "Answer the lady's section to continue.";
    if (form.ladyInTop6 === true && !form.ladyPosition) return "Select her finishing position.";
    if (form.ladyInTop6 === false && !form.firstLadyId) return "Select the 1st Lady rider.";
    if (!form.firstJuniorId)      return "Select the 1st Junior rider.";
    if (!form.prime1Id || !form.prime2Id) return "Select both prime winners to continue.";
    if (form.primesInTop6 === null) return "Answer the primes top 6 question.";
    if (form.primesInTop6 && !form.primesTop6Count) return "Select who finished in the top 6.";
    if (form.primesInTop6 && form.primesTop6Count === "prime1" && !form.prime1Position) return "Select Prime 1's finishing position.";
    if (form.primesInTop6 && form.primesTop6Count === "prime2" && !form.prime2Position) return "Select Prime 2's finishing position.";
    if (form.primesInTop6 && form.primesTop6Count === "both" && (!form.prime1Position || !form.prime2Position)) return "Select both primes' finishing positions.";
    return "Ready to publish.";
  }

  // -------------------------------------------------------------------------
  // Build payload matching route.ts RequestBody exactly
  // -------------------------------------------------------------------------
  function buildPayload() {
    const finishers = form.positions
      .map((rider_id, i) => ({ rider_id: rider_id!, position: i + 1 }))
      .filter((f) => f.rider_id);

    const placedIds = new Set(finishers.map((f) => f.rider_id));

    // first_lady_id: always send the rider ID; route checks placedRiderIds itself
    const first_lady_id = resolveLadyId();

    // first_junior_id: always the selected junior rider
    const first_junior_id = form.firstJuniorId ?? undefined;

    // prime_winners: prime_name must match the name field in scoring_templates.primes
    // ⚠️ ASSUMPTION: primes are named "Prime 1" and "Prime 2" in the scoring template
    const prime_winners: { rider_id: string; prime_name: string }[] = [];
    if (form.prime1Id) prime_winners.push({ rider_id: form.prime1Id, prime_name: "Prime 1" });
    if (form.prime2Id) prime_winners.push({ rider_id: form.prime2Id, prime_name: "Prime 2" });

    // unplaced_rider_ids: C2 and C3 winners if not already in top 6
    // route.ts fetches their category from riders table and awards unplaced_points accordingly
    const unplaced_rider_ids: string[] = [];
    if (form.firstC2Id && !placedIds.has(form.firstC2Id)) unplaced_rider_ids.push(form.firstC2Id);
    if (form.firstC3Id && !placedIds.has(form.firstC3Id)) unplaced_rider_ids.push(form.firstC3Id);

    return {
      fixture_id: form.fixtureId,
      finishers,
      first_lady_id,
      first_junior_id,
      prime_winners,
      unplaced_rider_ids,
    };
  }

  // -------------------------------------------------------------------------
  // Publish
  // -------------------------------------------------------------------------
  async function handlePublish() {
    if (!isFormValid()) return;
    setPublishing(true);
    try {
      const payload = buildPayload();

      const res = await fetch("/api/results/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? `Server error ${res.status}`);
      }

      const result = await res.json();
      toast.success(`Results published — ${result.results_created} rows created.`);
      setForm(emptyForm());
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to publish results");
    } finally {
      setPublishing(false);
    }
  }

  // -------------------------------------------------------------------------
  // Reusable rider selector
  // -------------------------------------------------------------------------
  function RiderSelect({
    id, value, onChange, placeholder = "Select rider…", exclude = new Set<string>(),
  }: {
    id?: string;
    value: string | null;
    onChange: (v: string | null) => void;
    placeholder?: string;
    exclude?: Set<string>;
  }) {
    return (
      <Select
        value={value ?? ""}
        onValueChange={(v) => onChange(v === "__clear__" ? null : v)}
        disabled={loadingRiders}
      >
        <SelectTrigger id={id} className="flex-1">
          <SelectValue placeholder={loadingRiders ? "Loading…" : placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__clear__">
            <span className="text-muted-foreground italic">— None —</span>
          </SelectItem>
          {riders.map((r) => (
            <SelectItem key={r.id} value={r.id} disabled={exclude.has(r.id)}>
              {r.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // Position dropdown — shows filled P1–P6 slots with rider names
  function PositionSelect({
    value, onChange,
  }: {
    value: number | null;
    onChange: (v: number) => void;
  }) {
    return (
      <Select
        value={value?.toString() ?? ""}
        onValueChange={(v) => onChange(parseInt(v))}
      >
        <SelectTrigger className="flex-1">
          <SelectValue placeholder="Select position…" />
        </SelectTrigger>
        <SelectContent>
          {form.positions.map((pid, i) =>
            pid ? (
              <SelectItem key={i} value={String(i + 1)}>
                P{i + 1} — {riderName(pid)}
              </SelectItem>
            ) : null
          )}
        </SelectContent>
      </Select>
    );
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Enter Results</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Select a fixture, assign positions and awards, then publish.
        </p>
      </div>

      <Separator />

      {/* ── Fixture ── */}
      <div className="space-y-2">
        <Label htmlFor="fixture-select">Fixture</Label>
        <Select
          value={form.fixtureId}
          onValueChange={(v) => setForm({ ...emptyForm(), fixtureId: v })}
        >
          <SelectTrigger id="fixture-select" className="w-full">
            <SelectValue placeholder="Select a fixture…" />
          </SelectTrigger>
          <SelectContent>
            {fixtures.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {f.name} — {fmtDate(f.date)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {form.fixtureId && (
        <>
          <Separator />

          {/* ── Winners ── */}
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold">Winners</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Top 6 finishing positions</p>
            </div>
            {Array.from({ length: POSITION_COUNT }, (_, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="w-8 shrink-0 text-sm font-medium text-right text-muted-foreground">
                  P{i + 1}
                </span>
                <RiderSelect
                  value={form.positions[i]}
                  onChange={(v) => setPosition(i, v)}
                  placeholder={i === 0 ? "Required" : "Select rider…"}
                  exclude={unavailableForPosition(i)}
                />
              </div>
            ))}
          </div>

          {allPositionsFilled && (
            <>
              <Separator />

              {/* ── Lady ── */}
              <div className="space-y-4">
                <div>
                  <h2 className="text-base font-semibold">Lady</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Was there a lady finisher in the top 6?
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  {[true, false].map((val) => (
                    <label key={String(val)} className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="radio"
                        name="lady-top6"
                        checked={form.ladyInTop6 === val}
                        onChange={() =>
                          setForm((p) => ({ ...p, ladyInTop6: val, ladyPosition: null, firstLadyId: null }))
                        }
                        className="accent-primary"
                      />
                      {val ? "Yes" : "No"}
                    </label>
                  ))}
                </div>
                {form.ladyInTop6 === true && (
                  <div className="flex items-center gap-4">
                    <span className="w-24 shrink-0 text-sm text-muted-foreground">Her position</span>
                    <PositionSelect
                      value={form.ladyPosition}
                      onChange={(v) => setForm((p) => ({ ...p, ladyPosition: v }))}
                    />
                  </div>
                )}
                {form.ladyInTop6 === false && (
                  <div className="flex items-center gap-4">
                    <span className="w-24 shrink-0 text-sm text-muted-foreground">1st Lady</span>
                    <RiderSelect
                      value={form.firstLadyId}
                      onChange={(v) => setForm((p) => ({ ...p, firstLadyId: v }))}
                      placeholder="Select rider…"
                    />
                  </div>
                )}
              </div>

              <Separator />

              {/* ── Junior ── */}
              <div className="space-y-4">
                <div>
                  <h2 className="text-base font-semibold">Junior</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Position points if top 6, otherwise 1 pt
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="w-8 shrink-0 text-sm font-medium text-right text-muted-foreground">
                    1st
                  </span>
                  <RiderSelect
                    value={form.firstJuniorId}
                    onChange={(v) =>
                      setForm((p) => ({ ...p, firstJuniorId: v, juniorInTop6: null }))
                    }
                    placeholder="Select rider…"
                  />
                </div>
                {form.firstJuniorId && (
                  <div className="flex items-center gap-3 pl-12">
                    <input
                      type="checkbox"
                      id="junior-top6"
                      checked={!!form.juniorInTop6}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, juniorInTop6: e.target.checked || null }))
                      }
                      className="accent-primary w-4 h-4"
                    />
                    <label htmlFor="junior-top6" className="text-sm cursor-pointer">
                      Did this junior finish in the top 6?
                    </label>
                  </div>
                )}
              </div>

              <Separator />

              {/* ── C2 ── */}
              <div className="space-y-3">
                <div>
                  <h2 className="text-base font-semibold">C2</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">1 pt if not in top 6</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="w-8 shrink-0 text-sm font-medium text-right text-muted-foreground">
                    1st
                  </span>
                  <RiderSelect
                    value={form.firstC2Id}
                    onChange={(v) => setForm((p) => ({ ...p, firstC2Id: v }))}
                    placeholder="Select rider…"
                  />
                </div>
              </div>

              <Separator />

              {/* ── C3 ── */}
              <div className="space-y-3">
                <div>
                  <h2 className="text-base font-semibold">C3</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">1 pt if not in top 6</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="w-8 shrink-0 text-sm font-medium text-right text-muted-foreground">
                    1st
                  </span>
                  <RiderSelect
                    value={form.firstC3Id}
                    onChange={(v) => setForm((p) => ({ ...p, firstC3Id: v }))}
                    placeholder="Select rider…"
                  />
                </div>
              </div>

              <Separator />

              {/* ── Primes ── */}
              <div className="space-y-4">
                <div>
                  <h2 className="text-base font-semibold">Primes</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    1 pt each regardless of top 6
                  </p>
                </div>

                {(["prime1Id", "prime2Id"] as const).map((key, i) => (
                  <div key={key} className="flex items-center gap-4">
                    <span className="w-14 shrink-0 text-sm font-medium text-right text-muted-foreground">
                      Prime {i + 1}
                    </span>
                    <RiderSelect
                      value={form[key]}
                      onChange={(v) =>
                        setForm((p) => ({
                          ...p,
                          [key]: v,
                          primesInTop6: null,
                          primesTop6Count: null,
                          prime1Position: null,
                          prime2Position: null,
                        }))
                      }
                      placeholder="Select rider…"
                    />
                  </div>
                ))}

                {bothPrimesSelected && (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Did either prime winner finish in the top 6?
                    </p>
                    <div className="flex items-center gap-6">
                      {[true, false].map((val) => (
                        <label key={String(val)} className="flex items-center gap-2 cursor-pointer text-sm">
                          <input
                            type="radio"
                            name="primes-top6"
                            checked={form.primesInTop6 === val}
                            onChange={() =>
                              setForm((p) => ({
                                ...p,
                                primesInTop6: val,
                                primesTop6Count: null,
                                prime1Position: null,
                                prime2Position: null,
                              }))
                            }
                            className="accent-primary"
                          />
                          {val ? "Yes" : "No"}
                        </label>
                      ))}
                    </div>

                    {form.primesInTop6 === true && (
                      <>
                        <p className="text-sm text-muted-foreground">
                          Who finished in the top 6?
                        </p>
                        <div className="flex items-center gap-6">
                          {(["prime1", "prime2", "both"] as const).map((val) => (
                            <label key={val} className="flex items-center gap-2 cursor-pointer text-sm">
                              <input
                                type="radio"
                                name="primes-who"
                                checked={form.primesTop6Count === val}
                                onChange={() =>
                                  setForm((p) => ({
                                    ...p,
                                    primesTop6Count: val,
                                    prime1Position: null,
                                    prime2Position: null,
                                  }))
                                }
                                className="accent-primary"
                              />
                              {val === "prime1" ? "Prime 1" : val === "prime2" ? "Prime 2" : "Both"}
                            </label>
                          ))}
                        </div>

                        {(form.primesTop6Count === "prime1" || form.primesTop6Count === "both") && (
                          <div className="flex items-center gap-4">
                            <span className="w-14 shrink-0 text-sm text-muted-foreground">
                              Prime 1
                            </span>
                            <PositionSelect
                              value={form.prime1Position}
                              onChange={(v) => setForm((p) => ({ ...p, prime1Position: v }))}
                            />
                          </div>
                        )}
                        {(form.primesTop6Count === "prime2" || form.primesTop6Count === "both") && (
                          <div className="flex items-center gap-4">
                            <span className="w-14 shrink-0 text-sm text-muted-foreground">
                              Prime 2
                            </span>
                            <PositionSelect
                              value={form.prime2Position}
                              onChange={(v) => setForm((p) => ({ ...p, prime2Position: v }))}
                            />
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>

              <Separator />

              {/* ── Publish ── */}
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{statusHint()}</p>
                <Button
                  onClick={handlePublish}
                  disabled={!isFormValid() || publishing}
                  size="lg"
                >
                  {publishing ? "Publishing…" : "Publish Results"}
                </Button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
