import { NextRequest, NextResponse } from 'next/server'
import db from '../../../lib/db'

interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
}

interface OrderRequest {
  items: CartItem[]
  total: number
  customerEmail?: string
}

interface DbOrder {
  id: string
  items: string
  total: number
  customer_email: string | null
  payment_address: string
  payment_reference: string
  status: string
  created_at: string
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type')
    if (!contentType?.includes('application/json')) {
      return NextResponse.json({ error: 'Content-Type must be application/json' }, { status: 400 })
    }
    
    const body: OrderRequest = await request.json()
    
    // Validate request
    if (!body.items || body.items.length === 0) {
      return NextResponse.json({ error: 'No items in cart' }, { status: 400 })
    }
    
    if (!body.total || body.total <= 0) {
      return NextResponse.json({ error: 'Invalid total amount' }, { status: 400 })
    }
    
    // Generate order ID and payment reference
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const paymentReference = `REF_${orderId.slice(-8).toUpperCase()}`
    
    // Store order in database
    const insertOrder = db.prepare(`
      INSERT INTO orders (id, items, total, customer_email, payment_address, payment_reference, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    
    try {
      await insertOrder.run(
        orderId,
        JSON.stringify(body.items),
        body.total,
        body.customerEmail || null,
        process.env.MURAL_MAIN_ACCOUNT_ADDRESS!,
        paymentReference,
        'pending',
        new Date().toISOString()
      )
    } catch (dbError) {
      console.error('Database insert error:', dbError)
      return NextResponse.json({ error: 'Failed to save order' }, { status: 500 })
    }
    
    return NextResponse.json({
      orderId,
      paymentAddress: process.env.MURAL_MAIN_ACCOUNT_ADDRESS!,
      paymentReference,
      amount: body.total.toFixed(2),
      currency: 'USDC',
      status: 'pending',
      message: `Send ${body.total.toFixed(2)} USDC to ${process.env.MURAL_MAIN_ACCOUNT_ADDRESS!}. Reference: ${paymentReference}`
    })
    
  } catch (error) {
    console.error('Order creation error:', error)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const orderId = searchParams.get('orderId')
  
  // If orderId is provided, return specific order
  if (orderId) {
    const getOrder = db.prepare('SELECT * FROM orders WHERE id = ?')
    const order = await getOrder.get(orderId) as DbOrder | undefined
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    
    return NextResponse.json({
      orderId: order.id,
      items: JSON.parse(order.items),
      total: order.total,
      customerEmail: order.customer_email,
      paymentAddress: order.payment_address,
      paymentReference: order.payment_reference,
      status: order.status,
      createdAt: order.created_at
    })
  }
  
  // Otherwise, return all orders
  const getAllOrders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC')
  const orders = await getAllOrders.all() as DbOrder[]
  
  const formattedOrders = orders.map((order: DbOrder) => ({
    orderId: order.id,
    items: JSON.parse(order.items),
    total: order.total,
    customerEmail: order.customer_email,
    paymentAddress: order.payment_address,
    paymentReference: order.payment_reference,
    status: order.status,
    createdAt: order.created_at
  }))
  
  return NextResponse.json(formattedOrders)
}