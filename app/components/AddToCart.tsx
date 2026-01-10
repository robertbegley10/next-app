'use client';
import React from 'react'
import { useCartActions } from '../hooks/useCartHooks'

interface Props {
  product: {
    id: number
    name: string
    price: number
  }
}

const AddToCart = ({ product }: Props) => {
  const { addItem } = useCartActions()

  const handleAddToCart = () => {
    console.log('Adding to cart:', product)
    addItem(product)
  }

  return (
    <button className="btn btn-primary btn-sm" onClick={handleAddToCart}>
      Add to Cart
    </button>
  )
}

export default AddToCart
