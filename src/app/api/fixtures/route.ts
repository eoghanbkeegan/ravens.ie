import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// GET /api/fixtures
// Returns list of fixtures, used for dropdowns in:
// - Admin rider import form (select which race to import riders for)
// - Admin results entry form (select which fixture to enter results for)
export async function GET(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const { searchParams } = new URL(req.url)
    const series_id = searchParams.get('series_id')
    const status = searchParams.get('status')

    let query = supabase
      .from('fixtures')
      .select('id, title, date, status, venue, series_id, categories')
      .order('date', { ascending: false })

    if (series_id) query = query.eq('series_id', series_id)
    if (status) query = query.eq('status', status)

    const { data, error } = await query

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch fixtures', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ fixtures: data })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}