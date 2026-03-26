import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type ScoringTemplate = {
  points_per_position: { position: number; points: number }[]
  has_first_lady: boolean
  first_lady_points: number
  has_first_junior: boolean
  first_junior_points: number
  prize_per_position: { position: number; amount: number }[]
  first_lady_prize: number
  first_junior_prize: number
  unplaced_points: Record<string, number> // e.g. { C2: 1, C3: 1 }
  primes: { name: string; points: number; prize?: number }[]
}

type Finisher = {
  rider_id: string
  position: number // 1-6
}

type RequestBody = {
  fixture_id: string
  finishers: Finisher[]           // top 6 placed riders
  first_lady_id?: string          // rider_id of first lady
  first_junior_id?: string        // rider_id of first junior
  prime_winners: { rider_id: string; prime_name: string }[]
  unplaced_rider_ids: string[]    // all unplaced riders for this fixture
}

// POST /api/results/calculate
// Core race engine — calculates points and prizes, inserts results,
// triggers payouts and winner emails
export async function POST(req: NextRequest) {
  try {
    const body: RequestBody = await req.json()
    const {
      fixture_id,
      finishers,
      first_lady_id,
      first_junior_id,
      prime_winners,
      unplaced_rider_ids,
    } = body

    // Validate required fields
    if (!fixture_id || !finishers || !Array.isArray(finishers)) {
      return NextResponse.json(
        { error: 'fixture_id and finishers are required' },
        { status: 400 }
      )
    }

    // 1. Fetch the fixture and resolve scoring template
    // Fixture can override the series scoring template
    const { data: fixture, error: fixtureError } = await supabase
      .from('fixtures')
      .select('id, series_id, scoring_template_id, series(scoring_template_id)')
      .eq('id', fixture_id)
      .single()

    if (fixtureError || !fixture) {
      return NextResponse.json({ error: 'Fixture not found' }, { status: 404 })
    }

    // Use fixture-level template override if set, otherwise fall back to series template
    const templateId =
      fixture.scoring_template_id ??
      (fixture.series as { scoring_template_id: string })?.scoring_template_id

    if (!templateId) {
      return NextResponse.json(
        { error: 'No scoring template found for this fixture or series' },
        { status: 400 }
      )
    }

    const { data: template, error: templateError } = await supabase
      .from('scoring_templates')
      .select('*')
      .eq('id', templateId)
      .single()

    if (templateError || !template) {
      return NextResponse.json({ error: 'Scoring template not found' }, { status: 404 })
    }

    const t = template as ScoringTemplate

    // 2. Build result rows
    const resultRows: {
      fixture_id: string
      rider_id: string
      position: number | null
      is_first_lady: boolean
      is_first_junior: boolean
      prime_won: string | null
      points_earned: number
      prize_amount: number
      payout_status: string
    }[] = []

    // Track placed rider IDs to avoid double-counting for first lady/junior
    const placedRiderIds = new Set(finishers.map((f) => f.rider_id))

    // 2a. Top 6 finishers — points and prizes from template
    for (const finisher of finishers) {
      const pointsEntry = t.points_per_position.find(
        (p) => p.position === finisher.position
      )
      const prizeEntry = t.prize_per_position.find(
        (p) => p.position === finisher.position
      )

      const isFirstLady = finisher.rider_id === first_lady_id
      const isFirstJunior = finisher.rider_id === first_junior_id
      const primeEntry = prime_winners.find((p) => p.rider_id === finisher.rider_id)

      let points = pointsEntry?.points ?? 0
      let prize = prizeEntry?.amount ?? 0

      // Add prime points if this rider also won a prime
      if (primeEntry) {
        const primeDef = t.primes.find((p) => p.name === primeEntry.prime_name)
        if (primeDef) {
          points += primeDef.points
          prize += primeDef.prize ?? 0
        }
      }

      resultRows.push({
        fixture_id,
        rider_id: finisher.rider_id,
        position: finisher.position,
        is_first_lady: isFirstLady,
        is_first_junior: isFirstJunior,
        prime_won: primeEntry?.prime_name ?? null,
        points_earned: points,
        prize_amount: prize,
        payout_status: 'pending',
      })
    }

    // 2b. First Lady — bonus points if NOT already in top 6
    if (first_lady_id && !placedRiderIds.has(first_lady_id) && t.has_first_lady) {
      const primeEntry = prime_winners.find((p) => p.rider_id === first_lady_id)
      let points = t.first_lady_points ?? 0
      let prize = t.first_lady_prize ?? 0

      if (primeEntry) {
        const primeDef = t.primes.find((p) => p.name === primeEntry.prime_name)
        if (primeDef) {
          points += primeDef.points
          prize += primeDef.prize ?? 0
        }
      }

      resultRows.push({
        fixture_id,
        rider_id: first_lady_id,
        position: null,
        is_first_lady: true,
        is_first_junior: false,
        prime_won: primeEntry?.prime_name ?? null,
        points_earned: points,
        prize_amount: prize,
        payout_status: 'pending',
      })
    }

    // 2c. First Junior — bonus points if NOT already in top 6
    if (first_junior_id && !placedRiderIds.has(first_junior_id) && t.has_first_junior) {
      const primeEntry = prime_winners.find((p) => p.rider_id === first_junior_id)
      let points = t.first_junior_points ?? 0
      let prize = t.first_junior_prize ?? 0

      if (primeEntry) {
        const primeDef = t.primes.find((p) => p.name === primeEntry.prime_name)
        if (primeDef) {
          points += primeDef.points
          prize += primeDef.prize ?? 0
        }
      }

      resultRows.push({
        fixture_id,
        rider_id: first_junior_id,
        position: null,
        is_first_lady: false,
        is_first_junior: true,
        prime_won: primeEntry?.prime_name ?? null,
        points_earned: points,
        prize_amount: prize,
        payout_status: 'pending',
      })
    }

    // 2d. Unplaced riders — category bonus points (C2/C3 get 1pt)
    if (unplaced_rider_ids.length > 0) {
      // Fetch categories for unplaced riders
      const { data: unplacedRiders, error: ridersError } = await supabase
        .from('riders')
        .select('id, category')
        .in('id', unplaced_rider_ids)

      if (ridersError) {
        return NextResponse.json({ error: ridersError.message }, { status: 500 })
      }

      for (const rider of unplacedRiders ?? []) {
        // Skip if already added (e.g. first lady/junior who is unplaced already handled above)
        if (resultRows.some((r) => r.rider_id === rider.id)) continue

        const categoryPoints = t.unplaced_points?.[rider.category] ?? 0
        const primeEntry = prime_winners.find((p) => p.rider_id === rider.id)
        let points = categoryPoints
        let prize = 0

        if (primeEntry) {
          const primeDef = t.primes.find((p) => p.name === primeEntry.prime_name)
          if (primeDef) {
            points += primeDef.points
            prize += primeDef.prize ?? 0
          }
        }

        resultRows.push({
          fixture_id,
          rider_id: rider.id,
          position: null,
          is_first_lady: false,
          is_first_junior: false,
          prime_won: primeEntry?.prime_name ?? null,
          points_earned: points,
          prize_amount: prize,
          payout_status: points > 0 || prize > 0 ? 'pending' : 'sent',
        })
      }
    }

    // 3. Insert all result rows into Supabase
    const { data: inserted, error: insertError } = await supabase
      .from('results')
      .insert(resultRows)
      .select()

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to insert results', details: insertError.message },
        { status: 500 }
      )
    }

    // 4. Trigger payouts and winner emails in parallel
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    await Promise.allSettled([
      fetch(`${baseUrl}/api/payouts/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fixture_id }),
      }),
      fetch(`${baseUrl}/api/emails/winners`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fixture_id }),
      }),
    ])

    return NextResponse.json({
      success: true,
      results_created: inserted?.length ?? 0,
      points_awarded: resultRows.map((r) => ({
        rider_id: r.rider_id,
        position: r.position,
        points: r.points_earned,
        prize: r.prize_amount,
      })),
    })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}