import { createClient } from '@libsql/client'

const DATABASE_CLIENT = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!
})

/**
 * Initialize database tables on module load
 */
async function initializeDatabaseTables(): Promise<void> {
  try {
    await DATABASE_CLIENT.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        items TEXT NOT NULL,
        total REAL NOT NULL,
        customer_email TEXT,
        payment_address TEXT NOT NULL,
        payment_reference TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TEXT NOT NULL
      )
    `)
    
    await DATABASE_CLIENT.execute(`
      CREATE TABLE IF NOT EXISTS payouts (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        amount REAL NOT NULL,
        currency TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `)
  } catch (error) {
    console.error('Database initialization error:', error)
    throw error
  }
}

// Initialize tables on module load
initializeDatabaseTables()

export default DATABASE_CLIENT