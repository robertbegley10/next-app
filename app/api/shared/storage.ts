// Shared storage for orders and payouts
export interface Order {
  orderId: string
  items: Array<{
    id: number
    name: string
    price: number
    quantity: number
  }>
  total: number
  customerEmail?: string
  paymentAddress: string
  paymentReference: string
  status: 'pending' | 'paid' | 'failed' | 'expired'
  createdAt: string
}

export interface Payout {
  payoutRequestId: string
  orderId: string
  amount: number
  currency: string
  status: string
  createdAt: string
  updatedAt: string
}

// Shared Maps
export const orders: Map<string, Order> = new Map()
export const payouts: Map<string, Payout> = new Map()