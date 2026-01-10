import sqlite3 from 'sqlite3'
import path from 'path'

const dbPath = path.join(process.cwd(), 'data.db')
const db = new sqlite3.Database(dbPath)

// Initialize tables
db.serialize(() => {
  db.run(`
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
  
  db.run(`
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
})

export const dbWrapper = {
  prepare: (sql: string) => {
    return {
      run: (...params: any[]) => {
        return new Promise((resolve, reject) => {
          db.run(sql, params, function(err) {
            if (err) reject(err)
            else resolve({ lastID: this.lastID, changes: this.changes })
          })
        })
      },
      get: (...params: any[]) => {
        return new Promise((resolve, reject) => {
          db.get(sql, params, (err, row) => {
            if (err) reject(err)
            else resolve(row)
          })
        })
      },
      all: (...params: any[]) => {
        return new Promise((resolve, reject) => {
          db.all(sql, params, (err, rows) => {
            if (err) reject(err)
            else resolve(rows)
          })
        })
      }
    }
  }
}

export default dbWrapper