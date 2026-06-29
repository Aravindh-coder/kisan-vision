import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import * as schema from './schema'
import dotenv from 'dotenv'
dotenv.config()

const pool = mysql.createPool({
  uri: process.env.DATABASE_URL!.replace('?ssl-mode=REQUIRED', ''),
  ssl: { rejectUnauthorized: false }
})

export const db = drizzle(pool, { schema, mode: 'default' })
