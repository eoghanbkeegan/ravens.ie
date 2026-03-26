import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'

type ResultWithRider = {
  id: string
  position: number
  points_earned: number
  prize_amount: number
  is_first_lady: boolean
  is_first_junior: boolean
  riders: {
    name: string
    email: string
  }
}

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const resend = new Resend(process.env.RESEND_API_KEY)

  const { fixture_id } = await req.json()

  if (!fixture_id) {
    return NextResponse.json({ error: 'fixture_id is required' }, { status: 400 })
  }

  // Fetch fixture details for the email
  const { data: fixture, error: fixtureError } = await supabase
    .from('fixtures')
    .select('title, date')
    .eq('id', fixture_id)
    .single()

  if (fixtureError || !fixture) {
    return NextResponse.json({ error: 'Fixture not found' }, { status: 404 })
  }

  // Fetch all placed results with rider info
  const { data: results, error } = await supabase
    .from('results')
    .select('id, position, points_earned, prize_amount, is_first_lady, is_first_junior, riders(name, email)')
    .eq('fixture_id', fixture_id)
    .not('position', 'is', null)
    .returns<ResultWithRider[]>()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!results || results.length === 0) {
    return NextResponse.json({ message: 'No placed results found for this fixture' })
  }

  const sent: string[] = []
  const failed: string[] = []

  for (const result of results) {
    const { name, email } = result.riders

    if (!email) {
      failed.push(name)
      continue
    }

    // Build special category label if applicable
    const specialLabel = result.is_first_lady
      ? ' — First Lady 🏆'
      : result.is_first_junior
      ? ' — First Junior 🏆'
      : ''

    const { error: emailError } = await resend.emails.send({
      from: 'Dublin Ravens Road Club <no-reply@ravens.ie>',
      to: email,
      subject: `Your result — ${fixture.title}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #c8102e;">Dublin Ravens Road Club</h2>
          <p>Hi ${name},</p>
          <p>Here are your results from <strong>${fixture.title}</strong>:</p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Position</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${result.position}${specialLabel}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Points earned</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${result.points_earned}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Prize</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">€${result.prize_amount.toFixed(2)}</td>
            </tr>
          </table>
          <p>Check the full standings at <a href="https://ravens.ie/standings">ravens.ie/standings</a></p>
          <p style="color: #888; font-size: 12px;">Dublin Ravens Road Club · Est. 2025</p>
        </div>
      `,
    })

    if (emailError) {
      failed.push(name)
    } else {
      sent.push(name)
    }
  }

  return NextResponse.json({
    success: true,
    sent: sent.length,
    failed: failed.length,
    sentTo: sent,
    failedFor: failed,
  })
}
