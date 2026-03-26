import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// GET /api/fixtures/[fixtureId]/results
// Returns full results for a single fixture
// Used by the public fixture results page
export async function GET(
  req: NextRequest,
  { params }: { params: { fixtureId: string } }
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const { fixtureId } = params

    if (!fixtureId) {
      return NextResponse.json(
        { error: 'fixtureId is required' },
        { status: 400 }
      )
    }

    // Fetch fixture metadata
    const { data: fixture, error: fixtureError } = await supabase
      .from('fixtures')
      .select('id, title, date, venue, status, series_id')
      .eq('id', fixtureId)
      .single()

    if (fixtureError || !fixture) {
      return NextResponse.json({ error: 'Fixture not found' }, { status: 404 })
    }

    // Fetch results with rider info
    // NULLS LAST puts unplaced riders after top 6, ordered by points
    const { data: results, error: resultsError } = await supabase
      .from('results')
      .select(`
        position,
        points_earned,
        prize_amount,
        is_first_lady,
        is_first_junior,
        prime_won,
        riders (
          name,
          team,
          category
        )
      `)
      .eq('fixture_id', fixtureId)
      .order('position', { ascending: true, nullsFirst: false })

    if (resultsError) {
      console.error('Supabase error:', resultsError)
      return NextResponse.json(
        { error: 'Failed to fetch results', details: resultsError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ fixture, results })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}