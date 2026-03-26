import { NextRequest, NextResponse } from 'next/server'
import { getAccessToken, PAYPAL_API } from '@/lib/paypal'

export async function POST(req: NextRequest) {
  try {
    const { product_id, size, quantity, price } = await req.json()

    if (!product_id || !size || !quantity || !price) {
      return NextResponse.json(
        { error: 'product_id, size, quantity and price are required' },
        { status: 400 }
      )
    }

    const accessToken = await getAccessToken()
    const total = (price * quantity).toFixed(2)

    const orderRes = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: { currency_code: 'EUR', value: total },
          description: `DRRC Kit - Size ${size} x${quantity}`,
        }],
      }),
    })

    const order = await orderRes.json()
    if (!order.id) {
      return NextResponse.json({ error: 'Failed to create PayPal order' }, { status: 500 })
    }

    return NextResponse.json({ paypal_order_id: order.id })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}