'use client'
import { useState } from 'react'

interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
}

interface OrderResponse {
  orderId: string
  paymentAddress: string
  amount: string
  currency: string
  status: string
  message: string
}

export const useOrders = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createOrder = async (items: CartItem[], total: number, customerEmail?: string): Promise<OrderResponse | null> => {
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
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }

  const getOrder = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders?orderId=${orderId}`)
      if (!response.ok) throw new Error('Order not found')
      return await response.json()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      return null
    }
  }

  return {
    createOrder,
    getOrder,
    loading,
    error
  }
}