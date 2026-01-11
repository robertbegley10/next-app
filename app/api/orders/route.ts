import { NextRequest, NextResponse } from 'next/server'
import DATABASE_CLIENT from '../../../lib/db'
import { CartItem } from '../../../lib/types'
import { DatabaseOrder } from '../../../lib/db'

interface CreateOrderRequest {
  items: CartItem[]
  total: number
  customerEmail?: string
}

/**
 * Generate a unique order ID
 */
function generateOrderId(): string {
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substr(2, 9)
  return `order_${timestamp}_${randomString}`
}

/**
 * Generate a payment reference for an order
 */
function generatePaymentReference(orderId: string): string {
  return `REF_${orderId.slice(-8).toUpperCase()}`
}

/**
 * Validate order request data
 */
function validateOrderRequest(body: CreateOrderRequest): string | null {
  if (!body.items || body.items.length === 0) {
    return 'No items in cart'
  }
  
  if (!body.total || body.total <= 0) {
    return 'Invalid total amount'
  }
  
  return null
}

/**
 * Create a new order
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const contentType = request.headers.get('content-type')
    if (!contentType?.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type must be application/json' }, 
        { status: 400 }
      )
    }
    
    const requestBody: CreateOrderRequest = await request.json()
    
    // Validate request
    const validationError = validateOrderRequest(requestBody)
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }
    
    // Generate order details
    const orderId = generateOrderId()
    const paymentReference = generatePaymentReference(orderId)
    const currentTimestamp = new Date().toISOString()
    
    // Store order in database
    try {
      await DATABASE_CLIENT.execute({
        sql: `INSERT INTO orders 
              (id, items, total, customer_email, payment_address, payment_reference, status, created_at) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          orderId,
          JSON.stringify(requestBody.items),
          requestBody.total,
          requestBody.customerEmail || null,
          process.env.MURAL_MAIN_ACCOUNT_ADDRESS!,
          paymentReference,
          'pending',
          currentTimestamp
        ]
      })
    } catch (databaseError) {
      console.error('Database insert error:', databaseError)
      return NextResponse.json(
        { error: 'Failed to save order' }, 
        { status: 500 }
      )
    }
    
    const paymentAddress = process.env.MURAL_MAIN_ACCOUNT_ADDRESS!
    const formattedAmount = requestBody.total.toFixed(2)
    
    return NextResponse.json({
      orderId,
      paymentAddress,
      paymentReference,
      amount: formattedAmount,
      currency: 'USDC',
      status: 'pending',
      message: `Send ${formattedAmount} USDC to ${paymentAddress}. Reference: ${paymentReference}`
    })
    
  } catch (error) {
    console.error('Order creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create order' }, 
      { status: 500 }
    )
  }
}

/**
 * Retrieve orders (all or by ID)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')
    
    if (orderId) {
      return await getOrderById(orderId)
    }
    
    return await getAllOrders()
  } catch (error) {
    console.error('Order retrieval error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve orders' }, 
      { status: 500 }
    )
  }
}

/**
 * Get a specific order by ID
 */
async function getOrderById(orderId: string): Promise<NextResponse> {
  const result = await DATABASE_CLIENT.execute({
    sql: 'SELECT * FROM orders WHERE id = ?',
    args: [orderId]
  })
  
  const databaseOrder = result.rows[0] as unknown as DatabaseOrder | undefined
  
  if (!databaseOrder) {
    return NextResponse.json(
      { error: 'Order not found' }, 
      { status: 404 }
    )
  }
  
  return NextResponse.json(formatOrderResponse(databaseOrder))
}

/**
 * Get all orders
 */
async function getAllOrders(): Promise<NextResponse> {
  const result = await DATABASE_CLIENT.execute({
    sql: 'SELECT * FROM orders ORDER BY created_at DESC',
    args: []
  })
  
  const databaseOrders = result.rows as unknown as DatabaseOrder[]
  const formattedOrders = databaseOrders.map(formatOrderResponse)
  
  return NextResponse.json(formattedOrders)
}

/**
 * Format database order for API response
 */
function formatOrderResponse(databaseOrder: DatabaseOrder) {
  return {
    orderId: databaseOrder.id,
    items: JSON.parse(databaseOrder.items),
    total: databaseOrder.total,
    customerEmail: databaseOrder.customer_email,
    paymentAddress: databaseOrder.payment_address,
    paymentReference: databaseOrder.payment_reference,
    status: databaseOrder.status,
    createdAt: databaseOrder.created_at
  }
}