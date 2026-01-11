'use client'
import { useCart } from '../context/CartContext'
import { CartItem } from '../../lib/types'

interface Product {
  id: number
  name: string
  price: number
}

interface CartActions {
  addItem: (product: Product) => void
  removeItem: (id: number) => void
  clearCart: () => void
}

interface CartData {
  items: CartItem[]
  total: number
  itemCount: number
}

/**
 * Hook for cart actions (add, remove, clear)
 */
export const useCartActions = (): CartActions => {
  const { dispatch } = useCart()
  
  const addItem = (product: Product): void => {
    dispatch({ type: 'ADD_ITEM', payload: product })
  }
  
  const removeItem = (id: number): void => {
    dispatch({ type: 'REMOVE_ITEM', payload: id })
  }
  
  const clearCart = (): void => {
    dispatch({ type: 'CLEAR_CART' })
  }
  
  return { addItem, removeItem, clearCart }
}

/**
 * Hook for cart data (items, total, count)
 */
export const useCartData = (): CartData => {
  const { state } = useCart()
  
  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0)
  
  return {
    items: state.items,
    total: state.total,
    itemCount
  }
}