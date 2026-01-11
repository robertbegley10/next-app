/**
 * Shared type definitions for the e-commerce application
 */

// Cart and Product Types
export interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
}

export interface Product {
  id: number
  name: string
  price: number
}

// Order Types
export interface Order {
  orderId: string
  items: CartItem[]
  total: number
  customerEmail?: string
  paymentAddress: string
  paymentReference: string
  status: 'pending' | 'paid' | 'failed' | 'expired'
  createdAt: string
}

export interface OrderResponse {
  orderId: string
  paymentAddress: string
  paymentReference: string
  amount: string
  currency: string
  status: string
  message: string
}

// Payout Types
export interface Payout {
  payoutRequestId: string
  orderId: string
  amount: number
  currency: string
  status: 'created' | 'awaitingExecution' | 'pending' | 'executed' | 'failed' | 'canceled'
  createdAt: string
  updatedAt: string
}

export interface PayoutResult {
  id: string
  status: string
  error?: string
}

// Cart State Types
export interface CartState {
  items: CartItem[]
  total: number
}

export type CartAction = 
  | { type: 'ADD_ITEM'; payload: Omit<CartItem, 'quantity'> }
  | { type: 'REMOVE_ITEM'; payload: number }
  | { type: 'CLEAR_CART' }


