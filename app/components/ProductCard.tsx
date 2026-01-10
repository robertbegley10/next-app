import React from 'react'
import AddToCart from './AddToCart'

interface Props{
    title: string;
    id: number;
    price: number;
}

const ProductCard = ({id, title, price}: Props) => {
  return (
    <div className="card bg-base-100 w-80 shadow-lg hover:shadow-xl transition-shadow">
      <figure className="px-4 pt-4">
        <img
          src="https://img.daisyui.com/images/stock/photo-1606107557195-0e29a4b5b4aa.webp"
          alt={title}
          className="rounded-lg object-cover h-48 w-full"
        />
      </figure>
      <div className="card-body p-4">
        <h2 className="card-title text-lg mb-2">{title}</h2>
        <p className="text-sm text-base-content/70 mb-4">
          A card component has a figure, a body part, and inside body there are title and actions parts
        </p>
        <div className="card-actions justify-between items-center mt-auto">
          <span className="text-lg font-bold text-primary">${price.toFixed(2)}</span>
          <AddToCart product={{ id, name: title, price }} />
        </div>
      </div>
    </div>
  )
}

export default ProductCard
