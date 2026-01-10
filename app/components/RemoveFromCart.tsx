'use client';
import React from 'react'
import { useCartActions } from '../hooks/useCartHooks'

interface Props {
  productId: number
}

const RemoveFromCart = ({ productId }: Props) => {
  const { removeItem } = useCartActions()

  const handleRemoveFromCart = () => {
    removeItem(productId)
  }

  return (
    <div className="flex justify-center items-center">
      <button 
        className="btn btn-sm btn-circle btn-ghost hover:btn-error" 
        onClick={handleRemoveFromCart}
        aria-label="Remove item"
      >
        ×
      </button>
    </div>
  )
}

export default RemoveFromCart
