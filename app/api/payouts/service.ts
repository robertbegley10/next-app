import db from '../../../lib/db'


export async function executePayoutRequest(payoutRequestId: string) {
  try {
    console.log(`Executing payout request: ${payoutRequestId}`)
    
    const executeResponse = await fetch(`${process.env.MURAL_API_BASE_URL}/api/payouts/payout/${payoutRequestId}/execute`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'authorization': `Bearer ${process.env.MURAL_API_KEY}`,
        'transfer-api-key': process.env.MURAL_TRANSFER_API_KEY!,
        'on-behalf-of': process.env.MURAL_ORGANIZATION_ID!,
        'Content-Type': 'application/json'
      },  
      body: JSON.stringify({
        exchangeRateToleranceMode: 'FLEXIBLE'
      })
    })
    
    if (!executeResponse.ok) {
      const errorText = await executeResponse.text()
      console.error('Payout execution failed:', executeResponse.status, errorText)
      return
    }
    
    const executeResult = await executeResponse.json()
    console.log('Payout executed successfully:', executeResult.status)
    return executeResult
    
  } catch (error) {
    console.error('Error executing payout:', error)
  }
}

export async function initiatePayoutToCOP(paymentData: {
  amount: number
  currency: string
  orderId: string
  transactionId: string
}) {
  try {
    console.log(`Initiating payout for order ${paymentData.orderId}: ${paymentData.amount} ${paymentData.currency} -> COP`)
    
    const payoutResponse = await fetch(`${process.env.MURAL_API_BASE_URL}/api/payouts/payout`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'authorization': `Bearer ${process.env.MURAL_API_KEY}`,
        'on-behalf-of': process.env.MURAL_ORGANIZATION_ID!,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sourceAccountId: process.env.MURAL_SOURCE_ACCOUNT_ID,
        memo: `Payout for order ${paymentData.orderId}`,
        payouts: [{
          amount: {
            tokenAmount: paymentData.amount,
            tokenSymbol: paymentData.currency
          },
          payoutDetails: {
            type: 'fiat',
            bankName: 'Bancamia S.A.',
            bankAccountOwner: 'Mock Name',
            fiatAndRailDetails: {
              type: 'cop',
              symbol: 'COP',
              phoneNumber: '+57 601 555 5555',
              accountType: 'CHECKING',
              bankAccountNumber: '1234567890',
              documentNumber: '1234567890',
              documentType: 'NATIONAL_ID'
            }
          },
          recipientInfo: {
            type: 'individual',
            firstName: 'Javier',
            lastName: 'Gomez',
            email: 'merchant@example.com',
            physicalAddress: {
              address1: '123 Main St',
              country: 'CO',
              state: 'DC',
              city: 'Bogotá',
              zip: '110111'
            }
          }
        }]
      })
    })
    
    if (!payoutResponse.ok) {
      const errorText = await payoutResponse.text()
      console.error('Payout initiation failed:', payoutResponse.status, errorText)
      
      const failedPayoutId = `failed_${Date.now()}_${paymentData.orderId}`
      
      // Store failed payout in database
      const insertFailedPayout = db.prepare(`
        INSERT INTO payouts (id, order_id, amount, currency, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      
      await insertFailedPayout.run(
        failedPayoutId,
        paymentData.orderId,
        paymentData.amount,
        paymentData.currency,
        'failed',
        new Date().toISOString(),
        new Date().toISOString()
      )
      
      return { id: failedPayoutId, status: 'failed', error: errorText }
    }
    
    const payoutResult = await payoutResponse.json()
    console.log('Payout initiated successfully:', {
      payoutId: payoutResult.id,
      status: payoutResult.status
    })
    
    // Store successful payout in database
    const insertPayout = db.prepare(`
      INSERT INTO payouts (id, order_id, amount, currency, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    
    await insertPayout.run(
      payoutResult.id,
      paymentData.orderId,
      paymentData.amount,
      paymentData.currency,
      'created',
      new Date().toISOString(),
      new Date().toISOString()
    )
    
    return payoutResult
    
  } catch (error) {
    console.error('Error initiating payout:', error)
  }
}