'use client'
import { useState, useEffect } from 'react'

interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
}

interface Order {
  orderId: string
  items: CartItem[]
  total: number
  customerEmail?: string
  paymentAddress: string
  status: 'pending' | 'paid' | 'failed'
  createdAt: string
}

const OrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchOrders()
    
    // Set up polling to refresh orders every 30 seconds
    // const interval = setInterval(fetchOrders, 30000)
    
    // return () => clearInterval(interval)
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders')
      if (!response.ok) throw new Error('Failed to fetch orders')
      const data = await response.json()
      setOrders(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      pending: 'badge-warning',
      paid: 'badge-success',
      failed: 'badge-error'
    }
    return `badge ${statusClasses[status as keyof typeof statusClasses] || 'badge-neutral'}`
  }

  if (loading) {
    return (
      <main className="container mx-auto px-6 py-8">
        <div className="flex justify-center">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </main>
    )
  }

  return (
    <main className="container mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">Orders</h1>
      
      {error && (
        <div className="alert alert-error mb-6">
          <span>{error}</span>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-lg text-base-content/70">No orders found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer Email</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.orderId}>
                  <td className="font-mono text-sm">{order.orderId}</td>
                  <td>{order.customerEmail || 'N/A'}</td>
                  <td>
                    <div className="text-sm">
                      {order.items.map((item, index) => (
                        <div key={item.id}>
                          {item.name} x{item.quantity}
                          {index < order.items.length - 1 && <br />}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="font-semibold">${order.total.toFixed(2)}</td>
                  <td>
                    <span className={getStatusBadge(order.status)}>
                      {order.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="text-sm">
                    {new Date(order.createdAt).toLocaleDateString()} <br />
                    {new Date(order.createdAt).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="mt-6 flex justify-end">
        <button 
          className="btn btn-outline"
          onClick={fetchOrders}
        >
          Refresh
        </button>
      </div>
    </main>
  )
}

export default OrdersPage