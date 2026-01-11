# Next.js E-commerce App with Mural Pay Integration

## Live Demo
The app is deployed on Vercel and can be viewed at: https://next-app-six-mu.vercel.app/

## Setup Instructions

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- Mural Pay API credentials
- Turso database account (optional - will use local SQLite if not configured)

### Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd next-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment variables:
   ```bash
   cp .env.example .env.local
   ```
   
   Configure the following variables in `.env.local`:
   ```
    MURAL_API_KEY
    MURAL_TRANSFER_API_KEY
    MURAL_ORGANIZATION_ID
    MURAL_SOURCE_ACCOUNT_ID
    MURAL_API_BASE_URL
    MURAL_MAIN_ACCOUNT_ADDRESS
    MURAL_WEBHOOK_PUBLIC_KEY
    TURSO_AUTH_TOKEN
    TURSO_DATABASE_URL
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Database Setup
- If Turso credentials are provided, the app will use Turso SQLite
- If not configured, it will create a local `data.db` file
- Database tables are automatically initialized on first run

## Implemented Pages

### Frontend Pages
- **Home Page** (`/`) - Product catalog with add to cart functionality
- **Cart Page** (`/cart`) - Shopping cart with checkout modal and order creation
- **Orders Page** (`/orders`) - View all orders with status tracking
- **Withdrawals Page** (`/withdrawals`) - View all payouts and their statuses

### API Endpoints
- **Orders API** (`/api/orders`) - Create and retrieve orders
- **Webhooks API** (`/api/webhooks/mural`) - Handle Mural Pay webhook events
- **Withdrawals API** (`/api/withdrawals`) - Retrieve payout information
- **Payouts Service** (`/api/payouts/service`) - Initiate and execute payouts

## Features
- Product catalog with shopping cart
- Order creation with USDC payment instructions
- Webhook handling for payment confirmations
- Automatic payout initiation to Colombian Pesos (COP)
- Turso SQLite database for order and payout persistence
- Real-time status updates via webhooks

## Database
Uses SQLite through Turso for serverless compatibility:
- **Database Provider**: Turso (serverless SQLite)
- **Tables**:
  - `orders` - Customer orders and payment status
  - `payouts` - Payout requests and execution status
- **Connection**: Uses `@libsql/client` with environment variables for URL and auth token

## Cart Storage
- **Client-side storage**: Uses browser localStorage to persist cart items
- **Data structure**: Array of cart items with id, name, price, and quantity
- **Persistence**: Cart data survives browser refresh and session changes
- **Clearing**: Cart is automatically cleared after successful order creation

## Order Processing & Payment Flow
- **Order Creation**: Orders are persisted to SQLite database with 'pending' status and unique payment reference
- **Payment Detection**: Mural Pay webhooks (`account_credited`) detect incoming USDC payments and match them to pending orders by amount
- **Order Updates**: Successful payments automatically update order status from 'pending' to 'paid' in the database
- **Payout Automation**: Paid orders trigger automatic payout initiation to Colombian Pesos (COP)
- **Payout Tracking**: Webhook events (`payout_request_status_changed`, `payout_status_changed`) update payout status in real-time

## Limitations & Improvements
- **Payment Matching**: Currently uses payment amount to match payins against orders. Generating unique wallet addresses for each order would allow the system to easily identify which payin corresponds to each specific order. This would also prevent unmatched payins from getting stuck in the account as we could identify overpayments and underpayments, then handle these issues by refunding or requesting additional funds
- **Database**: Integrate with a deployed datastore such as PostgreSQL or MySQL for better scalability and persistence
- **Authentication**: Add login page to prevent unauthorized access to orders and withdrawals pages
- **Error Handling**: Revised error handling and retry mechanisms for API calls and webhook processing
- **Webhook Reliability**: Since orders and payouts are stored within the system and updates rely solely on webhook API calls, failed webhook requests can leave orders or withdrawals stuck in pending state. Add a periodic sync mechanism to check Mural Pay APIs for payin/payout status updates to ensure all information stored within the app remains up to date
- **Webhook Processing**: Webhook requests should immediately acknowledge receipt and perform all processing asynchronously in the background to prevent timeouts and ensure reliable delivery
- **Real-time Updates**: No mechanism exists to push updates to the client when order/payout status changes. Implemented refresh button due to time constraints - should add WebSocket or Server-Sent Events for real-time status updates
- **Webhook Security**: Webhook signature validation was skipped due to time constraints and should be implemented for production use
- **UI/UX**: Improve the styling and user interface design of the application