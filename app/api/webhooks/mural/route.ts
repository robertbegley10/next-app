import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import db from '../../../../lib/db'
import { executePayoutRequest, initiatePayoutToCOP} from '../../payouts/service'

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
  eventId: string;
  deliveryId: string;
  attemptNumber: number;
  eventCategory: MuralEventCategory;
  occurredAt: string; // ISO 8601 datetime
  payload: WebhookPayload;
}

function verifyMuralWebhook(
  requestBody: string,
  signature: string,
  timestamp: string,
  publicKey: string
): boolean {
  try {
    // Construct the message that was signed
    const messageToSign = `${timestamp}.${requestBody}`
    
    // Decode the base64 signature
    const signatureBuffer = Buffer.from(signature, 'base64')
    
    // Verify the ECDSA signature using the public key
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


export async function POST(request: NextRequest) {
  try {
    // Get headers for webhook validation
    const signature = request.headers.get('x-mural-webhook-signature')
    const timestamp = request.headers.get('x-mural-webhook-timestamp')
    
    // Get raw body for signature verification
    const rawBody = await request.text()
    
    // Validate webhook signature if headers are present
    if (signature && timestamp && process.env.MURAL_WEBHOOK_PUBLIC_KEY) {
      const isValid = verifyMuralWebhook(
        rawBody,
        signature,
        timestamp,
        process.env.MURAL_WEBHOOK_PUBLIC_KEY
      )
      
      if (!isValid) {
        console.error('Invalid webhook signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }
    
    const reqBody: WebhookEventRequestBody = JSON.parse(rawBody)
    const payload: WebhookPayload = reqBody.payload
    
    console.log('Full webhook payload:', JSON.stringify(reqBody, null, 2))
    console.log('Received webhook:', { type: payload.type })
    
    // Handle account credited events
    if (payload.type === 'account_credited') {
      return await handleAccountCredited(payload)
    }
    
    // Handle payout events
    if (payload.type === 'payout_request_status_changed') {
      console.log('Payout request status changed:', payload.statusChangeDetails)
      
      // Update payout status in database
      const updatePayout = db.prepare('UPDATE payouts SET status = ?, updated_at = ? WHERE id = ?')
      await updatePayout.run(
        payload.statusChangeDetails.currentStatus.type,
        new Date().toISOString(),
        payload.payoutRequestId
      )
      
      return NextResponse.json({ success: true, message: 'Payout request status updated' })
    }
    
    if (payload.type === 'payout_status_changed') {
      console.log('Payout status changed:', {
        payoutId: payload.payoutId,
        type: payload.statusChangeDetails.type,
        status: payload.statusChangeDetails.currentStatus.type
      })
      
      // Update individual payout status in database
      const updatePayout = db.prepare('UPDATE payouts SET status = ?, updated_at = ? WHERE id = ?')
      await updatePayout.run(
        payload.statusChangeDetails.currentStatus.type,
        new Date().toISOString(),
        payload.payoutRequestId
      )
      
      return NextResponse.json({ success: true, message: 'Payout status updated' })
    }
    
    return NextResponse.json({ error: 'Unknown webhook type' }, { status: 200 })
    
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function handleAccountCredited(payload: AccountCreditedPayload) {
  try {
    // Check if the payin is to the correct account
    if (payload.accountId !== process.env.MURAL_SOURCE_ACCOUNT_ID) {
      console.log(`Payment to wrong account: ${payload.accountId}, expected: ${process.env.MURAL_SOURCE_ACCOUNT_ID}`)
      return NextResponse.json({ 
        success: false, 
        message: 'Payment to incorrect account'
      })
    }
    
    // Find matching order by amount and status
    const getMatchingOrder = db.prepare('SELECT * FROM orders WHERE total = ? AND status = ? LIMIT 1')
    const matchedOrder = await getMatchingOrder.get(payload.tokenAmount.tokenAmount, 'pending') as any
    
    console.log(`Found matching order:`, matchedOrder)

    if (matchedOrder) {
      // Update order status in database
      const updateOrder = db.prepare('UPDATE orders SET status = ? WHERE id = ?')
      await updateOrder.run('paid', matchedOrder.id)
      
      console.log(`Order ${matchedOrder.id} marked as paid`)
      
      const payoutResult = await initiatePayoutToCOP({
        amount: payload.tokenAmount.tokenAmount,
        currency: payload.tokenAmount.tokenSymbol,
        orderId: matchedOrder.id,
        transactionId: payload.transactionId
      })
      
      // Execute payout if initiation was successful
      if (payoutResult && payoutResult.id && payoutResult.status !== 'failed') {
        const executeResult = await executePayoutRequest(payoutResult.id)
        
        // Update payout status based on execution result
        if (executeResult) {
          const updatePayout = db.prepare('UPDATE payouts SET status = ?, updated_at = ? WHERE id = ?')
          await updatePayout.run(
            executeResult.status || 'pending',
            new Date().toISOString(),
            payoutResult.id
          )
        }
      }
      
      return NextResponse.json({ 
        success: true, 
        orderId: matchedOrder.id,
        message: 'Payment confirmed and payout initiated'
      })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Payment received but no matching order found'
    })
    
  } catch (error) {
    console.error('Account credited processing error:', error)
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }
}

// Handle webhook verification (optional)
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    status: 'Mural Pay webhook endpoint active',
    endpoint: '/api/webhooks/mural'
  })
}