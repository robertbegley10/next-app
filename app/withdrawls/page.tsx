'use client'
import { useState, useEffect } from 'react'

interface Payout {
  payoutRequestId: string
  orderId: string
  amount: number
  currency: string
  status: 'created' | 'awaitingExecution' | 'pending' | 'executed' | 'failed' | 'canceled'
  createdAt: string
  updatedAt: string
}

const WithdrawalsPage = () => {
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPayouts()
  }, [])

  const fetchPayouts = async () => {
    try {
      const response = await fetch('/api/withdrawals')
      if (!response.ok) throw new Error('Failed to fetch payouts')
      const data = await response.json()
      setPayouts(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      created: 'badge-info',
      awaitingExecution: 'badge-warning',
      pending: 'badge-primary',
      executed: 'badge-success',
      failed: 'badge-error',
      canceled: 'badge-neutral'
    }
    return `badge ${statusClasses[status as keyof typeof statusClasses] || 'badge-neutral'}`
  }

  const formatCurrency = (amount: number, currency: string) => {
    return `${amount.toFixed(2)} ${currency}`
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
      <h1 className="text-2xl font-bold mb-6">Payouts</h1>
      
      {error && (
        <div className="alert alert-error mb-6">
          <span>{error}</span>
        </div>
      )}

      {payouts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-lg text-base-content/70">No payouts found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Payout ID</th>
                <th>Order ID</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Created</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((payout) => (
                <tr key={payout.payoutRequestId}>
                  <td className="font-mono text-sm">{payout.payoutRequestId}</td>
                  <td className="font-mono text-sm">{payout.orderId}</td>
                  <td className="font-semibold">{formatCurrency(payout.amount, payout.currency)}</td>
                  <td>
                    <span className={getStatusBadge(payout.status)}>
                      {payout.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="text-sm">
                    {new Date(payout.createdAt).toLocaleDateString()}
                  </td>
                  <td className="text-sm">
                    {new Date(payout.updatedAt).toLocaleDateString()}
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
          onClick={fetchPayouts}
        >
          Refresh
        </button>
      </div>
    </main>
  )
}

export default WithdrawalsPage