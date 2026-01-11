'use client'
import { useState } from 'react'
import { CartItem } from '../../lib/types'

interface OrderResponse {
  orderId: string
  paymentAddress: string
  paymentReference: string
  amount: string
  currency: string
  status: string
  message: string
}

interface OrderHookReturn {
  createOrder: (items: CartItem[], total: number, customerEmail?: string) => Promise<OrderResponse | null>
  getOrderById: (orderId: string) => Promise<any>
  loading: boolean
  error: string | null
}

/**
 * Hook for managing order operations
 */
export const useOrders = (): OrderHookReturn => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Create a new order
   */
  const createOrder = async (
    items: CartItem[], 
    total: number, 
    customerEmail?: string
  ): Promise<OrderResponse | null> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items,
          total,
          customerEmail
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create order')
      }
      
      const orderData = await response.json()
      return orderData
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      console.error('Order creation error:', err)
      return null
    } finally {
      setLoading(false)
    }
  }

  /**
   * Get an order by ID
   */
  const getOrderById = async (orderId: string): Promise<any> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/orders?orderId=${encodeURIComponent(orderId)}`)
      
      if (!response.ok) {
        throw new Error('Order not found')
      }
      
      return await response.json()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      console.error('Order retrieval error:', err)
      return null
    } finally {
      setLoading(false)
    }
  }

  return {
    createOrder,
    getOrderById,
    loading,
    error
  }
}