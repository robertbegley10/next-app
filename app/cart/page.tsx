'use client'
import { useState } from 'react'
import RemoveFromCart from '../components/RemoveFromCart'
import { useCartData, useCartActions } from '../hooks/useCartHooks'
import { useOrders } from '../hooks/useOrders'



const CartPage = () => {
  const { items, total } = useCartData()
  const { clearCart } = useCartActions()
  const { createOrder, loading, error } = useOrders()
  const [email, setEmail] = useState('')
  const [orderResult, setOrderResult] = useState<any>(null)

  const handleCheckout = async () => {
    if (!email.trim()) {
      alert('Please enter your email address')
      return
    }
    
    const result = await createOrder(items, total, email)
    if (result) {
      setOrderResult(result)
      clearCart() // Clear cart after successful order
    }
  }

  return (
    <main className="container mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">Shopping Cart</h1>
      
      <div className="overflow-x-auto mb-6">
        <table className="table w-full">
          <thead>
            <tr>
              <th>Product</th>
              <th>Price</th>
              <th>Quantity</th>
              <th>Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>${item.price.toFixed(2)}</td>
                <td>{item.quantity}</td>
                <td>${(item.price * item.quantity).toFixed(2)}</td>
                <td>
                  <RemoveFromCart productId={item.id}/>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="flex flex-col items-end gap-4">
        <div className="text-xl font-bold">
          Total: ${total.toFixed(2)}
        </div>
        <button 
          className="btn btn-primary" 
          onClick={()=>document.getElementById('checkout')?.showModal()}
        >
          Checkout
        </button>
      </div>
        
      <dialog id="checkout" className="modal">
        <div className="modal-box">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
          </form>
          
          <h3 className="font-bold text-lg mb-4">Checkout</h3>
          
          {!orderResult ? (
            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Email Address</span>
                </label>
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  className="input input-bordered w-full" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="bg-base-200 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Order Summary</h4>
                <div className="text-sm space-y-1">
                  {items.map(item => (
                    <div key={item.id} className="flex justify-between">
                      <span>{item.name} x{item.quantity}</span>
                      <span>${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 font-bold flex justify-between">
                    <span>Total:</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              {error && (
                <div className="alert alert-error">
                  <span>{error}</span>
                </div>
              )}
              
              <button 
                className={`btn btn-primary w-full ${loading ? 'loading' : ''}`}
                onClick={handleCheckout}
                disabled={loading}
              >
                {loading ? 'Creating Order...' : 'Create Order'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="alert alert-success">
                <span>Order created successfully!</span>
              </div>
              
              <div className="bg-base-200 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Payment Instructions</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Order ID:</strong> {orderResult.orderId}</div>
                  <div><strong>Amount:</strong> {orderResult.amount} {orderResult.currency}</div>
                  <div><strong>Payment Address:</strong></div>
                  <div className="bg-base-100 p-2 rounded font-mono text-xs break-all">
                    {orderResult.paymentAddress}
                  </div>
                  <div className="text-info">{orderResult.message}</div>
                </div>
              </div>
              
              <button 
                className="btn btn-outline w-full"
                onClick={() => {
                  setOrderResult(null)
                  setEmail('')
                  document.getElementById('checkout')?.close()
                }}
              >
                Close
              </button>
            </div>
          )}
        </div>
      </dialog>
    </main>
  )
}

export default CartPage
