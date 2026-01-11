import { NextRequest, NextResponse } from 'next/server'
import DATABASE_CLIENT from '../../../lib/db'

export interface Payout {
  payoutRequestId: string
  orderId: string
  amount: number
  currency: string
  status: 'created' | 'awaitingExecution' | 'pending' | 'executed' | 'failed' | 'canceled'
  createdAt: string
  updatedAt: string
}

interface DatabasePayout {
  id: string
  order_id: string
  amount: number
  currency: string
  status: string
  created_at: string
  updated_at: string
}

/**
 * Retrieve all payouts/withdrawals
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const result = await DATABASE_CLIENT.execute({
      sql: 'SELECT * FROM payouts ORDER BY created_at DESC',
      args: []
    })
    
    const databasePayouts = result.rows as unknown as DatabasePayout[]
    const formattedPayouts = databasePayouts.map(formatPayoutResponse)
    
    return NextResponse.json(formattedPayouts)
  } catch (error) {
    console.error('Error retrieving payouts:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve payouts' },
      { status: 500 }
    )
  }
}

/**
 * Format database payout for API response
 */
function formatPayoutResponse(databasePayout: DatabasePayout): Payout {
  return {
    payoutRequestId: databasePayout.id,
    orderId: databasePayout.order_id,
    amount: databasePayout.amount,
    currency: databasePayout.currency,
    status: databasePayout.status as Payout['status'],
    createdAt: databasePayout.created_at,
    updatedAt: databasePayout.updated_at
  }
}
