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
  const getAllPayouts = db.prepare('SELECT * FROM payouts ORDER BY created_at DESC')
  const payoutList = await getAllPayouts.all() as any[]
  
  const formattedPayouts = payoutList.map(payout => ({
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
