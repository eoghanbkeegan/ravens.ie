import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// POST /api/kit/products
// Creates a new kit product in the kit_products table
export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const body = await req.json()
    const { name, description, price, sizes, images, product_type,
            order_window_open, order_window_close, active } = body

    if (!name || price === undefined || price === null) {
      return NextResponse.json(
        { error: 'name and price are required' }, { status: 400 }
      )
    }

    if (typeof price !== 'number' || price < 0) {
      return NextResponse.json(
        { error: 'price must be a positive number' }, { status: 400 }
      )
    }

    if (product_type && !['preorder', 'instock'].includes(product_type)) {
      return NextResponse.json(
        { error: 'product_type must be preorder or instock' }, { status: 400 }
      )
    }

    if (order_window_open && order_window_close) {
      if (new Date(order_window_open) >= new Date(order_window_close)) {
        return NextResponse.json(
          { error: 'order_window_open must be before order_window_close' }, { status: 400 }
        )
      }
    }

    const { data, error } = await supabase
      .from('kit_products')
      .insert({
        name,
        description: description ?? null,
        price,
        sizes: sizes ?? ['XS', 'S', 'M', 'L', 'XL', '2XL'],
        images: images ?? [],
        product_type: product_type ?? 'preorder',
        order_window_open: order_window_open ?? null,
        order_window_close: order_window_close ?? null,
        active: active ?? true,
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to create product', details: error.message }, { status: 500 }
      )
    }

    return NextResponse.json({ success: true, product: data }, { status: 201 })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/kit/products
// Returns all active kit products for the public kit shop page
export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  try {
    const { data, error } = await supabase
      .from('kit_products')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch products', details: error.message }, { status: 500 }
      )
    }

    return NextResponse.json({ products: data })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}