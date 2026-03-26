import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getResend } from '@/lib/email'
import { getAccessToken, PAYPAL_API } from '@/lib/paypal'

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const resend = getResend() 
  try {
    const {
      paypal_order_id, product_id, size, quantity,
      amount_paid, buyer_name, buyer_email, delivery_address,
    } = await req.json()

    if (!paypal_order_id || !product_id || !size || !quantity ||
        !amount_paid || !buyer_name || !buyer_email || !delivery_address) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Capture payment — don't save order if this fails
    const accessToken = await getAccessToken()

    const captureRes = await fetch(
      `${PAYPAL_API}/v2/checkout/orders/${paypal_order_id}/capture`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    const capture = await captureRes.json()

    if (capture.status !== 'COMPLETED') {
      console.error('PayPal capture failed:', capture)
      return NextResponse.json(
        { error: 'Payment capture failed', details: capture },
        { status: 500 }
      )
    }

    // Insert order into Supabase only after successful capture
    const { data: order, error: dbError } = await supabase
      .from('kit_orders')
      .insert({
        product_id, buyer_name, buyer_email,
        delivery_address, size, quantity,
        amount_paid, paypal_order_id, status: 'paid',
      })
      .select()
      .single()

    if (dbError) {
      console.error('Supabase error:', dbError)
      return NextResponse.json(
        { error: 'Payment captured but failed to save order', details: dbError.message },
        { status: 500 }
      )
    }

    // Send confirmation email
    await resend.emails.send({
      from: 'DRRC Kit Shop <noreply@ravens.ie>',
      to: buyer_email,
      subject: 'Your DRRC Kit Order Confirmation',
      html: `
        <h2>Thanks for your order, ${buyer_name}!</h2>
        <p>Your order has been confirmed and payment received.</p>
        <table>
          <tr><td><strong>Order ID:</strong></td><td>${order.id}</td></tr>
          <tr><td><strong>Size:</strong></td><td>${size}</td></tr>
          <tr><td><strong>Quantity:</strong></td><td>${quantity}</td></tr>
          <tr><td><strong>Amount Paid:</strong></td><td>€${amount_paid}</td></tr>
          <tr><td><strong>Delivery Address:</strong></td><td>${delivery_address}</td></tr>
        </table>
        <p>We'll be in touch when your kit is ready to ship.</p>
        <p>— DRRC</p>
      `,
    })

    return NextResponse.json({ success: true, order_id: order.id })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}