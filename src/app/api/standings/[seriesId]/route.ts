export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: { seriesId: string } }
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let { seriesId } = params

  if (!seriesId || seriesId === 'default') {
    const { data: latest } = await supabase
      .from('series')
      .select('id')
      .order('year', { ascending: false })
      .limit(1)
      .single()

    if (!latest) {
      return NextResponse.json([], { status: 200 })
    }
    seriesId = latest.id
  }

  const { data, error } = await supabase
    .from('standings')
    .select('*')
    .eq('series_id', seriesId)
    .order('rank')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}