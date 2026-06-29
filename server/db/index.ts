import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import * as schema from './schema'
import dotenv from 'dotenv'
dotenv.config()

const rawUrl = (process.env.DATABASE_URL || '').replace('?ssl-mode=REQUIRED', '')

const pool = mysql.createPool({
  uri: rawUrl,
  ssl: { rejectUnauthorized: false },
  waitForConnections: true,
  connectionLimit: 5
})

export const db = drizzle(pool, { schema, mode: 'default' })
