import { NextRequest, NextResponse } from 'next/server'
import { getAccessToken, PAYPAL_API } from '@/lib/paypal'

type OrderItem = {
  product_id: string
  name: string
  size: string
  quantity: number
  price: number
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Support both old single-item format and new multi-item format
    let items: OrderItem[] = []
    let total: number

    if (body.items && Array.isArray(body.items)) {
      // New format: { items: [...], total: number }
      items = body.items
      total = body.total
    } else {
      // Old format: { product_id, size, quantity, price }
      const { product_id, size, quantity, price } = body
      if (!product_id || !size || !quantity || !price) {
        return NextResponse.json(
          { error: 'product_id, size, quantity and price are required' },
          { status: 400 }
        )
      }
      items = [{ product_id, name: 'DRRC Kit', size, quantity, price }]
      total = price * quantity
    }

    if (!items.length) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 })
    }

    const accessToken = await getAccessToken()
    const totalFormatted = Number(total).toFixed(2)

    // Build PayPal line items
    const purchaseItems = items.map(item => ({
      name: `${item.name} - Size ${item.size}`,
      quantity: String(item.quantity),
      unit_amount: {
        currency_code: 'EUR',
        value: Number(item.price).toFixed(2),
      },
    }))

    const description = items
      .map(i => `${i.name} (${i.size} x${i.quantity})`)
      .join(', ')

    const orderRes = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'EUR',
            value: totalFormatted,
            breakdown: {
              item_total: {
                currency_code: 'EUR',
                value: totalFormatted,
              },
            },
          },
          description,
          items: purchaseItems,
        }],
      }),
    })

const order = await orderRes.json()

if (!order.id) {
  console.error('PayPal order creation failed:', JSON.stringify(order, null, 2))
  return NextResponse.json({ 
    error: `PayPal error: ${order.message ?? order.name ?? 'Unknown error'}`,
    details: order
  }, { status: 500 })
}

    return NextResponse.json({ paypal_order_id: order.id })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}