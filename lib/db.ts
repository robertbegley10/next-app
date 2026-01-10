import fs from 'fs'
import path from 'path'

interface DbOrder {
  id: string
  items: string
  total: number
  customer_email: string | null
  payment_address: string
  payment_reference: string
  status: string
  created_at: string
}

interface DbPayout {
  id: string
  order_id: string
  amount: number
  currency: string
  status: string
  created_at: string
  updated_at: string
}

interface Database {
  orders: DbOrder[]
  payouts: DbPayout[]
}

// Use environment variable for database path, fallback to temp directory
const dbPath = process.env.DATABASE_PATH || path.join('/tmp', 'data.json')

function readDb(): Database {
  try {
    if (!fs.existsSync(dbPath)) {
      return { orders: [], payouts: [] }
    }
    const data = fs.readFileSync(dbPath, 'utf8')
    return JSON.parse(data)
  } catch {
    return { orders: [], payouts: [] }
  }
}

function writeDb(data: Database): void {
  try {
    // Ensure directory exists
    const dir = path.dirname(dbPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2))
  } catch (error) {
    console.error('Failed to write database:', error)
  }
}

export const dbWrapper = {
  prepare: (sql: string) => {
    return {
      run: (...params: any[]) => {
        return new Promise((resolve, reject) => {
          try {
            const data = readDb()
            
            if (sql.includes('INSERT INTO orders')) {
              const order: DbOrder = {
                id: params[0],
                items: params[1],
                total: params[2],
                customer_email: params[3],
                payment_address: params[4],
                payment_reference: params[5],
                status: params[6],
                created_at: params[7]
              }
              data.orders.push(order)
              writeDb(data)
            } else if (sql.includes('INSERT INTO payouts')) {
              const payout: DbPayout = {
                id: params[0],
                order_id: params[1],
                amount: params[2],
                currency: params[3],
                status: params[4],
                created_at: params[5],
                updated_at: params[6]
              }
              data.payouts.push(payout)
              writeDb(data)
            } else if (sql.includes('UPDATE orders')) {
              const orderIndex = data.orders.findIndex(o => o.id === params[1])
              if (orderIndex !== -1) {
                data.orders[orderIndex].status = params[0]
                writeDb(data)
              }
            } else if (sql.includes('UPDATE payouts')) {
              const payoutIndex = data.payouts.findIndex(p => p.id === params[2])
              if (payoutIndex !== -1) {
                data.payouts[payoutIndex].status = params[0]
                data.payouts[payoutIndex].updated_at = params[1]
                writeDb(data)
              }
            }
            
            resolve({ changes: 1 })
          } catch (error) {
            reject(error)
          }
        })
      },
      get: (...params: any[]) => {
        return new Promise((resolve, reject) => {
          try {
            const data = readDb()
            
            if (sql.includes('SELECT * FROM orders WHERE total = ? AND status = ?')) {
              const order = data.orders.find(o => 
                Math.abs(o.total - params[0]) < 0.01 && o.status === params[1]
              )
              resolve(order)
            } else if (sql.includes('SELECT * FROM orders WHERE id = ?')) {
              const order = data.orders.find(o => o.id === params[0])
              resolve(order)
            } else {
              resolve(null)
            }
          } catch (error) {
            reject(error)
          }
        })
      },
      all: (...params: any[]) => {
        return new Promise((resolve, reject) => {
          try {
            const data = readDb()
            
            if (sql.includes('SELECT * FROM orders ORDER BY created_at DESC')) {
              const sorted = data.orders.sort((a, b) => 
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              )
              resolve(sorted)
            } else if (sql.includes('SELECT * FROM payouts ORDER BY created_at DESC')) {
              const sorted = data.payouts.sort((a, b) => 
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              )
              resolve(sorted)
            } else {
              resolve([])
            }
          } catch (error) {
            reject(error)
          }
        })
      }
    }
  }
}

export default dbWrapper