import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getResend } from '@/lib/email'
import { getAccessToken, PAYPAL_API } from '@/lib/paypal'

type OrderItem = {
  product_id: string
  size: string
  quantity: number
  amount_paid: number
}

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )


  try {
    const {
      paypal_order_id,
      items,
      total_amount,
      buyer_name,
      buyer_email,
      delivery_address,
    } = await req.json()

    if (!paypal_order_id || !items || !total_amount || !buyer_name || !buyer_email || !delivery_address) {
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
    console.log('PayPal capture response:', JSON.stringify(capture, null, 2))

    if (capture.status !== 'COMPLETED') {
      console.error('PayPal capture failed:', capture)
      return NextResponse.json(
        { error: 'Payment capture failed', details: capture },
        { status: 500 }
      )
    }

    // Insert one order row per item after successful capture
    const insertedOrders = []
    for (const item of items as OrderItem[]) {
      const { data: order, error: dbError } = await supabase
        .from('kit_orders')
        .insert({
          product_id: item.product_id,
          buyer_name,
          buyer_email,
          delivery_address,
          size: item.size,
          quantity: item.quantity,
          amount_paid: item.amount_paid,
          paypal_order_id,
          status: 'paid',
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
      insertedOrders.push(order)
    }

    // Build email items summary
    const itemRows = (items as OrderItem[])
      .map((item) => `<tr>
        <td>${item.product_id}</td>
        <td>${item.size}</td>
        <td>${item.quantity}</td>
        <td>€${item.amount_paid.toFixed(2)}</td>
      </tr>`)
      .join('')

// Send confirmation email — non-blocking, don't fail the order if email fails
try {
  const resend = getResend()
  await resend.emails.send({
    from: 'DRRC Kit Shop <noreply@ravens.ie>',
    to: buyer_email,
    subject: 'Your DRRC Kit Order Confirmation',
    html: `
      <h2>Thanks for your order, ${buyer_name}!</h2>
      <p>Your order has been confirmed and payment received.</p>
      <table border="1" cellpadding="8" cellspacing="0">
        <thead>
          <tr>
            <th>Product</th>
            <th>Size</th>
            <th>Qty</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
        <tfoot>
          <tr>
            <td colspan="3"><strong>Total</strong></td>
            <td><strong>€${Number(total_amount).toFixed(2)}</strong></td>
          </tr>
        </tfoot>
      </table>
      <p><strong>Delivery Address:</strong> ${delivery_address}</p>
      <p>Kit is made to order and dispatched twice a year. We'll be in touch when your order ships.</p>
      <p>— Dublin Ravens Road Club</p>
    `,
  })
} catch (emailErr) {
  console.warn('Email send failed (non-blocking):', emailErr)
}

    return NextResponse.json({
      success: true,
      order_id: insertedOrders[0]?.id ?? paypal_order_id,
    })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}