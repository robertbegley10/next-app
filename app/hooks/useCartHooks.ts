'use client'
import { useCart } from '../context/CartContext'

export const useCartActions = () => {
  const { dispatch } = useCart()
  
  const addItem = (product: { id: number; name: string; price: number }) => {
    dispatch({ type: 'ADD_ITEM', payload: product })
  }
  
  const removeItem = (id: number) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id })
  }
  
  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' })
  }
  
  return { addItem, removeItem, clearCart }
}

export const useCartData = () => {
  const { state } = useCart()
  
  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0)
  
  return {
    items: state.items,
    total: state.total,
    itemCount
  }
}