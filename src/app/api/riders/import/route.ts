import { createClient } from '@supabase/supabase-js'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { NextRequest, NextResponse } from 'next/server'



export async function POST(req: NextRequest) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const formData = await req.formData()
    const file = formData.get('file') as File
    const fixture_id = formData.get('fixture_id') as string

    if (!fixture_id) {
        return NextResponse.json({ error: 'fixture_id is required' }, { status: 400 })
    }

    if (!file) {
        return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const buffer = await file.arrayBuffer()
    let rows: Record<string, string>[] = []

    if (file.name.endsWith('.csv')) {
        const text = new TextDecoder().decode(buffer)
        const { data } = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true })
        rows = data
    } else {
        const workbook = XLSX.read(buffer, { type: 'array' })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        rows = XLSX.utils.sheet_to_json(sheet)
    }

    const riders = rows.map((r) => ({
        name: r['Name'] || r['name'],
        team: r['Team'] || r['team'] || null,
        category: r['Category'] || r['category'] || null,
        email: r['Email'] || r['email'] || null,
        cycling_ireland_num: r['CI Number'] || r['cycling_ireland_num'] || null,
        paypal_email: r['PayPal Email'] || r['paypal_email'] || null,
    }))

    let imported = 0
    const errors: string[] = []

    for (const rider of riders) {
        // 1 — Upsert rider
        const { data: upsertedRider, error: riderError } = await supabase
            .from('riders')
            .upsert(rider, { onConflict: 'name,cycling_ireland_num' })
            .select()
            .single()

        if (riderError || !upsertedRider) {
            errors.push(`Failed to upsert rider ${rider.name}: ${riderError?.message}`)
            continue
        }

        // 2 — Link rider to fixture
        const { error: linkError } = await supabase
            .from('fixture_riders')
            .upsert(
                { fixture_id, rider_id: upsertedRider.id },
                { onConflict: 'fixture_id,rider_id' }
            )

        if (linkError) {
            errors.push(`Failed to link ${rider.name} to fixture: ${linkError.message}`)
            continue
        }

        imported++
    }

    return NextResponse.json({ success: true, imported, errors })
}
