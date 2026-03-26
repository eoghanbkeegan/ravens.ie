import { createClient } from '@supabase/supabase-js'
import { sendPayouts } from '@/lib/paypal'
import { NextRequest, NextResponse } from 'next/server'

type ResultWithRider = {
  id: string
  prize_amount: number
  rider_id: string
  riders: {
    email: string
    paypal_email: string | null
  }
}

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { fixture_id } = await req.json()

  if (!fixture_id) {
    return NextResponse.json({ error: 'fixture_id is required' }, { status: 400 })
  }

  // Fetch all pending cash results for this fixture
  const { data: results, error } = await supabase
    .from('results')
    .select('id, prize_amount, rider_id, riders(email, paypal_email)')
    .eq('fixture_id', fixture_id)
    .eq('payout_status', 'pending')
    .gt('prize_amount', 0)
    .returns<ResultWithRider[]>()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!results || results.length === 0) {
    return NextResponse.json({ message: 'No pending payouts found' })
  }

  // Split into PayPal-eligible and manual
  const eligible: ResultWithRider[] = []
  const manual: ResultWithRider[] = []

  for (const r of results) {
    if (r.riders?.paypal_email) {
      eligible.push(r)
    } else {
      manual.push(r)
    }
  }

  let batchId: string | null = null

  // Send PayPal batch payout
  if (eligible.length > 0) {
    batchId = await sendPayouts(
      eligible.map((r) => ({
        email: r.riders.paypal_email as string,
        amount: r.prize_amount,
        riderId: r.rider_id,
      }))
    )

    // Update payout status to sent
    await supabase
      .from('results')
      .update({ payout_status: 'sent', payout_batch_id: batchId })
      .in('id', eligible.map((r) => r.id))
  }

  // Flag manual payouts
  if (manual.length > 0) {
    await supabase
      .from('results')
      .update({ payout_status: 'failed' })
      .in('id', manual.map((r) => r.id))
  }

  return NextResponse.json({
    success: true,
    sent: eligible.length,
    manual: manual.length,
    batchId,
  })
}