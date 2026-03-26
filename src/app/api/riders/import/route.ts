import { createClient } from '@supabase/supabase-js'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { NextRequest, NextResponse } from 'next/server'

// NOTE: This route expects an Event Master CSV/Excel export.
// Column names are mapped to match the Event Master export format exactly.
//
// IMPORTANT — Full Series riders:
// If a rider's "Timeslot Name" contains the word "Series", they are linked
// to ALL fixtures in the series rather than a single fixture.
// This relies on Event Master consistently using "Series" in the timeslot name
// for full series bookings. Coordinators must keep this naming consistent
// when setting up events in Event Master.

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const formData = await req.formData()
  const file = formData.get('file') as File
  const fixture_id = formData.get('fixture_id') as string
  const series_id = formData.get('series_id') as string

  if (!fixture_id) {
    return NextResponse.json({ error: 'fixture_id is required' }, { status: 400 })
  }

  if (!series_id) {
    return NextResponse.json({ error: 'series_id is required' }, { status: 400 })
  }

  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
  }

  // Parse file
  const buffer = await file.arrayBuffer()
  let rows: Record<string, string>[] = []

  if (file.name.endsWith('.csv')) {
    const text = new TextDecoder().decode(buffer)
    const { data } = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
    })
    rows = data
  } else {
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    rows = XLSX.utils.sheet_to_json(sheet)
  }

  // Fetch all fixtures in this series upfront (needed for full series riders)
  const { data: seriesFixtures, error: fixturesError } = await supabase
    .from('fixtures')
    .select('id')
    .eq('series_id', series_id)

  if (fixturesError || !seriesFixtures) {
    return NextResponse.json(
      { error: 'Failed to fetch series fixtures', details: fixturesError?.message },
      { status: 500 }
    )
  }

  const allFixtureIds = seriesFixtures.map((f) => f.id)

  let imported = 0
  const errors: string[] = []

  for (const row of rows) {
    // Skip cancelled or invalid bookings
    if (row['Status'] && row['Status'] !== 'VALID') continue

    // Map Event Master column names to rider fields
    const firstName = row['First Name'] ?? ''
    const lastName = row['Last Name'] ?? ''
    const name = `${firstName} ${lastName}`.trim()

    if (!name) continue

    const rider = {
      name,
      team: row['CI Club'] ?? null,
      category: row['CI Rider Category'] ?? null,
      email: row['Email'] ?? null,
      cycling_ireland_num: row['CI Licence Number'] ?? null,
    }

    // 1 — Upsert rider
    const { data: upsertedRider, error: riderError } = await supabase
      .from('riders')
      .upsert(rider, { onConflict: 'name,cycling_ireland_num' })
      .select()
      .single()

    if (riderError || !upsertedRider) {
      errors.push(`Failed to upsert rider ${name}: ${riderError?.message}`)
      continue
    }

    // 2 — Determine which fixtures to link to
    // If Timeslot Name contains "Series", link to all fixtures in the series
    // Otherwise link to just the selected fixture
    // NOTE: Event Master must use "Series" in the timeslot name for full series bookings
    const timeslotName = row['Timeslot Name'] ?? ''
    const isFullSeries = timeslotName.toLowerCase().includes('series')
    const fixtureIdsToLink = isFullSeries ? allFixtureIds : [fixture_id]

    // 3 — Link rider to fixture(s)
    for (const fid of fixtureIdsToLink) {
      const { error: linkError } = await supabase
        .from('fixture_riders')
        .upsert(
          { fixture_id: fid, rider_id: upsertedRider.id },
          { onConflict: 'fixture_id,rider_id' }
        )

      if (linkError) {
        errors.push(`Failed to link ${name} to fixture ${fid}: ${linkError.message}`)
      }
    }

    imported++
  }

  return NextResponse.json({ success: true, imported, errors })
}