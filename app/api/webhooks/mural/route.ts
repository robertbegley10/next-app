import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import DATABASE_CLIENT from '../../../../lib/db'
import { executePayoutRequest, initiatePayoutToCOP } from '../../payouts/service'

interface AccountCreditedPayload {
  type: 'account_credited'
  accountId: string
  organizationId: string
  transactionId: string
  accountWalletAddress: string
  tokenAmount: {
    blockchain: string
    tokenAmount: number
    tokenSymbol: string
    tokenContractAddress: string
  }
  transactionDetails: {
    blockchain: string
    transactionDate: string
    transactionHash: string
    sourceWalletAddress: string
    destinationWalletAddress: string
  }
}

interface PayoutRequestStatusChangedPayload {
  type: 'payout_request_status_changed'
  organizationId: string
  payoutRequestId: string
  statusChangeDetails: {
    previousStatus: { type: string }
    currentStatus: { type: string }
  }
}

interface PayoutStatusChangedPayload {
  type: 'payout_status_changed'
  organizationId: string
  payoutRequestId: string
  payoutId: string
  statusChangeDetails: {
    type: 'fiat' | 'blockchain'
    previousStatus: { type: string }
    currentStatus: { type: string }
  }
}

type WebhookPayload = AccountCreditedPayload | PayoutRequestStatusChangedPayload | PayoutStatusChangedPayload

type MuralEventCategory = 'MURAL_ACCOUNT_BALANCE_ACTIVITY' | 'PAYOUT_REQUEST'

interface WebhookEventRequestBody {
  eventId: string
  deliveryId: string
  attemptNumber: number
  eventCategory: MuralEventCategory
  occurredAt: string // ISO 8601 datetime
  payload: WebhookPayload
}

/**
 * Verify Mural webhook signature (currently disabled)
 */
function verifyMuralWebhookSignature(
  requestBody: string,
  signature: string,
  timestamp: string,
  publicKey: string
): boolean {
  try {
    const messageToSign = `${timestamp}.${requestBody}`
    const signatureBuffer = Buffer.from(signature, 'base64')
    
    const isValid = crypto.verify(
      'sha256',
      Buffer.from(messageToSign),
      {
        key: publicKey,
        dsaEncoding: 'der',
      },
      signatureBuffer
    )
    return isValid
  } catch (error) {
    console.error('Signature verification failed:', error)
    return false
  }
}

/**
 * Handle incoming Mural Pay webhooks
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const signature = request.headers.get('x-mural-webhook-signature')
    const timestamp = request.headers.get('x-mural-webhook-timestamp')
    const rawBody = await request.text()
    
    // TODO: Enable webhook signature validation for production
    // if (signature && timestamp && process.env.MURAL_WEBHOOK_PUBLIC_KEY) {
    //   const isValid = verifyMuralWebhookSignature(
    //     rawBody,
    //     signature,
    //     timestamp,
    //     process.env.MURAL_WEBHOOK_PUBLIC_KEY
    //   )
    //   
    //   if (!isValid) {
    //     console.error('Invalid webhook signature')
    //     return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    //   }
    // }
    
    const webhookBody: WebhookEventRequestBody = JSON.parse(rawBody)
    const payload: WebhookPayload = webhookBody.payload
    
    console.log('Full webhook payload:', JSON.stringify(webhookBody, null, 2))
    console.log('Received webhook type:', payload.type)
    
    switch (payload.type) {
      case 'account_credited':
        return await handleAccountCreditedEvent(payload)
      
      case 'payout_request_status_changed':
        return await handlePayoutRequestStatusChanged(payload)
      
      case 'payout_status_changed':
        return await handlePayoutStatusChanged(payload)
      
      default:
        console.warn('Unknown webhook type:', payload.type)
        return NextResponse.json(
          { error: 'Unknown webhook type' }, 
          { status: 400 }
        )
    }
    
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' }, 
      { status: 500 }
    )
  }
}

/**
 * Handle account credited webhook events
 */
async function handleAccountCreditedEvent(payload: AccountCreditedPayload): Promise<NextResponse> {
  try {
    // Validate account ID
    if (payload.accountId !== process.env.MURAL_SOURCE_ACCOUNT_ID) {
      console.log(
        `Payment to wrong account: ${payload.accountId}, expected: ${process.env.MURAL_SOURCE_ACCOUNT_ID}`
      )
      return NextResponse.json({
        success: false,
        message: 'Payment to incorrect account'
      })
    }
    
    // Find matching pending order
    const matchedOrder = await findMatchingOrder(
      payload.tokenAmount.tokenAmount,
      payload.tokenAmount.tokenSymbol
    )
    
    if (!matchedOrder) {
      console.log('No matching order found for payment')
      return NextResponse.json({
        success: true,
        message: 'Payment received but no matching order found'
      })
    }
    
    // Process the matched order
    await processMatchedOrder(matchedOrder, payload)
    
    return NextResponse.json({
      success: true,
      orderId: matchedOrder.id,
      message: 'Payment confirmed and payout initiated'
    })
    
  } catch (error) {
    console.error('Account credited processing error:', error)
    return NextResponse.json(
      { error: 'Processing failed' }, 
      { status: 500 }
    )
  }
}

/**
 * Handle payout request status change events
 */
async function handlePayoutRequestStatusChanged(
  payload: PayoutRequestStatusChangedPayload
): Promise<NextResponse> {
  try {
    console.log('Payout request status changed:', payload.statusChangeDetails)
    
    await updatePayoutStatus(
      payload.payoutRequestId,
      payload.statusChangeDetails.currentStatus.type
    )
    
    return NextResponse.json({
      success: true,
      message: 'Payout request status updated'
    })
  } catch (error) {
    console.error('Payout request status update error:', error)
    return NextResponse.json(
      { error: 'Failed to update payout request status' },
      { status: 500 }
    )
  }
}

/**
 * Handle payout status change events
 */
async function handlePayoutStatusChanged(
  payload: PayoutStatusChangedPayload
): Promise<NextResponse> {
  try {
    console.log('Payout status changed:', {
      payoutId: payload.payoutId,
      type: payload.statusChangeDetails.type,
      status: payload.statusChangeDetails.currentStatus.type
    })
    
    await updatePayoutStatus(
      payload.payoutRequestId,
      payload.statusChangeDetails.currentStatus.type
    )
    
    return NextResponse.json({
      success: true,
      message: 'Payout status updated'
    })
  } catch (error) {
    console.error('Payout status update error:', error)
    return NextResponse.json(
      { error: 'Failed to update payout status' },
      { status: 500 }
    )
  }
}

/**
 * Find a matching order for the payment
 */
async function findMatchingOrder(amount: number, tokenSymbol: string): Promise<any> {
  if (tokenSymbol !== 'USDC') {
    console.log(`Unsupported token symbol: ${tokenSymbol}`)
    return null
  }
  
  const result = await DATABASE_CLIENT.execute({
    sql: 'SELECT * FROM orders WHERE total = ? AND status = ? LIMIT 1',
    args: [amount, 'pending']
  })
  
  const matchedOrder = result.rows[0]
  console.log('Found matching order:', matchedOrder)
  
  return matchedOrder || null
}

/**
 * Process a matched order by updating status and initiating payout
 */
async function processMatchedOrder(order: any, payload: AccountCreditedPayload): Promise<void> {
  // Update order status to paid
  await DATABASE_CLIENT.execute({
    sql: 'UPDATE orders SET status = ? WHERE id = ?',
    args: ['paid', order.id]
  })
  
  console.log(`Order ${order.id} marked as paid`)
  
  // Initiate payout
  const payoutResult = await initiatePayoutToCOP({
    amount: payload.tokenAmount.tokenAmount,
    currency: payload.tokenAmount.tokenSymbol,
    orderId: order.id,
    transactionId: payload.transactionId
  })
  
  // Execute payout if initiation was successful
  if (payoutResult?.id && payoutResult.status !== 'failed') {
    const executeResult = await executePayoutRequest(payoutResult.id)
    
    if (executeResult) {
      await updatePayoutStatus(
        payoutResult.id,
        executeResult.status || 'pending'
      )
    }
  }
}

/**
 * Update payout status in database
 */
async function updatePayoutStatus(payoutId: string, status: string): Promise<void> {
  await DATABASE_CLIENT.execute({
    sql: 'UPDATE payouts SET status = ?, updated_at = ? WHERE id = ?',
    args: [status, new Date().toISOString(), payoutId]
  })
}

/**
 * Health check endpoint for webhook
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  return NextResponse.json({
    status: 'Mural Pay webhook endpoint active',
    endpoint: '/api/webhooks/mural',
    timestamp: new Date().toISOString()
  })
}