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

  const { seriesId } = params

  if (!seriesId) {
    return NextResponse.json({ error: 'seriesId is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('standings')
    .select('*')
    .eq('series_id', seriesId)
    .order('rank')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}