import React from 'react'
import ProductCard from '../components/ProductCard'
import { products } from '@/lib/constants'



const ProductsPage = async () => {
    return (
        <main className="container mx-auto px-6 py-8">
            <h1 className="text-2xl font-bold mb-6 text-center">Products</h1>
            <div className="flex flex-wrap gap-6 justify-center">
                {products.map((product) => (
                    <ProductCard key={product.id} {...product}/>
                ))}
            </div>
        </main>
    )
}

export default ProductsPage
