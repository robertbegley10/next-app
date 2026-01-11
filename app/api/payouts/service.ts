import DATABASE_CLIENT from '../../../lib/db'

interface PayoutRequestData {
  amount: number
  currency: string
  orderId: string
  transactionId: string
}

interface PayoutResult {
  id: string
  status: string
  error?: string
}

interface MuralPayoutRequest {
  sourceAccountId: string
  memo: string
  payouts: Array<{
    amount: {
      tokenAmount: number
      tokenSymbol: string
    }
    payoutDetails: {
      type: 'fiat'
      bankName: string
      bankAccountOwner: string
      fiatAndRailDetails: {
        type: 'cop'
        symbol: 'COP'
        phoneNumber: string
        accountType: 'CHECKING'
        bankAccountNumber: string
        documentNumber: string
        documentType: 'NATIONAL_ID'
      }
    }
    recipientInfo: {
      type: 'individual'
      firstName: string
      lastName: string
      email: string
      physicalAddress: {
        address1: string
        country: string
        state: string
        city: string
        zip: string
      }
    }
  }>
}

/**
 * Execute a payout request that has been initiated
 */
export async function executePayoutRequest(payoutRequestId: string): Promise<any> {
  try {
    console.log(`Executing payout request: ${payoutRequestId}`)
    
    const executeResponse = await fetch(
      `${process.env.MURAL_API_BASE_URL}/api/payouts/payout/${payoutRequestId}/execute`,
      {
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
      }
    )
    
    if (!executeResponse.ok) {
      const errorText = await executeResponse.text()
      console.error('Payout execution failed:', executeResponse.status, errorText)
      return null
    }
    
    const executeResult = await executeResponse.json()
    console.log('Payout executed successfully:', executeResult.status)
    return executeResult
    
  } catch (error) {
    console.error('Error executing payout:', error)
    return null
  }
}

/**
 * Initiate a payout to Colombian Pesos (COP)
 */
export async function initiatePayoutToCOP(paymentData: PayoutRequestData): Promise<PayoutResult | null> {
  try {
    console.log(
      `Initiating payout for order ${paymentData.orderId}: ${paymentData.amount} ${paymentData.currency} -> COP`
    )
    
    const payoutRequest: MuralPayoutRequest = createPayoutRequest(paymentData)
    const payoutResponse = await sendPayoutRequest(payoutRequest)
    
    if (!payoutResponse.ok) {
      const errorText = await payoutResponse.text()
      console.error('Payout initiation failed:', payoutResponse.status, errorText)
      
      await storeFailedPayout(paymentData, errorText)
      return {
        id: `failed_${Date.now()}_${paymentData.orderId}`,
        status: 'failed',
        error: errorText
      }
    }
    
    const payoutResult = await payoutResponse.json()
    console.log('Payout initiated successfully:', {
      payoutId: payoutResult.id,
      status: payoutResult.status
    })
    
    await storeSuccessfulPayout(paymentData, payoutResult.id)
    return payoutResult
    
  } catch (error) {
    console.error('Error initiating payout:', error)
    return null
  }
}

/**
 * Create the payout request payload for Mural API
 */
function createPayoutRequest(paymentData: PayoutRequestData): MuralPayoutRequest {
  return {
    sourceAccountId: process.env.MURAL_SOURCE_ACCOUNT_ID!,
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
  }
}

/**
 * Send payout request to Mural API
 */
async function sendPayoutRequest(payoutRequest: MuralPayoutRequest): Promise<Response> {
  return fetch(`${process.env.MURAL_API_BASE_URL}/api/payouts/payout`, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'authorization': `Bearer ${process.env.MURAL_API_KEY}`,
      'on-behalf-of': process.env.MURAL_ORGANIZATION_ID!,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payoutRequest)
  })
}

/**
 * Store failed payout in database
 */
async function storeFailedPayout(paymentData: PayoutRequestData, errorText: string): Promise<void> {
  const failedPayoutId = `failed_${Date.now()}_${paymentData.orderId}`
  const currentTimestamp = new Date().toISOString()
  
  await DATABASE_CLIENT.execute({
    sql: `INSERT INTO payouts 
          (id, order_id, amount, currency, status, created_at, updated_at) 
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [
      failedPayoutId,
      paymentData.orderId,
      paymentData.amount,
      paymentData.currency,
      'failed',
      currentTimestamp,
      currentTimestamp
    ]
  })
}

/**
 * Store successful payout in database
 */
async function storeSuccessfulPayout(paymentData: PayoutRequestData, payoutId: string): Promise<void> {
  const currentTimestamp = new Date().toISOString()
  
  await DATABASE_CLIENT.execute({
    sql: `INSERT INTO payouts 
          (id, order_id, amount, currency, status, created_at, updated_at) 
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [
      payoutId,
      paymentData.orderId,
      paymentData.amount,
      paymentData.currency,
      'created',
      currentTimestamp,
      currentTimestamp
    ]
  })
}