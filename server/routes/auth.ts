import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { db } from '../db/index'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'kisan_secret'

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body
    const existing = await db.select().from(users).where(eq(users.email, email))
    if (existing.length > 0) return res.status(400).json({ error: 'Email already exists' })
    const hashed = await bcrypt.hash(password, 10)
    await db.insert(users).values({ name, email, password: hashed, role: role || 'farmer' })
    res.json({ message: 'User registered successfully' })
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' })
  }
})

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const result = await db.select().from(users).where(eq(users.email, email))
    if (result.length === 0) return res.status(401).json({ error: 'Invalid credentials' })
    const user = result[0]
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' })
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' })
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } })
  } catch (err) {
    res.status(500).json({ error: 'Login failed' })
  }
})

export default router

router.get('/test-db', async (req, res) => {
  try {
    const result = await db.select().from(users).limit(1)
    res.json({ ok: true, count: result.length })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})
