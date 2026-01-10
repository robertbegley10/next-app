import { NextRequest, NextResponse } from 'next/server'
import db from '../../../lib/db'

export interface Payout {
  payoutRequestId: string
  orderId: string
  amount: number
  currency: string
  status: 'created' | 'awaitingExecution' | 'pending' | 'executed' | 'failed' | 'canceled'
  createdAt: string
  updatedAt: string
}

export async function GET(request: NextRequest) {
  const result = await db.execute({
    sql: 'SELECT * FROM payouts ORDER BY created_at DESC',
    args: []
  })
  
  const formattedPayouts = result.rows.map((payout: any) => ({
    payoutRequestId: payout.id,
    orderId: payout.order_id,
    amount: payout.amount,
    currency: payout.currency,
    status: payout.status,
    createdAt: payout.created_at,
    updatedAt: payout.updated_at
  }))
  
  return NextResponse.json(formattedPayouts)
}
