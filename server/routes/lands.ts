import express from 'express'
import { db } from '../db/index'
import { sql } from 'drizzle-orm'
// nodemailer removed — using Brevo HTTP API
import twilio from 'twilio'
import dotenv from 'dotenv'
dotenv.config()

const router = express.Router()


const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null

const initTable = async () => {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS lands (
        id INT AUTO_INCREMENT PRIMARY KEY,
        farmer_name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(255) NOT NULL,
        land_name VARCHAR(255),
        crop_type VARCHAR(100),
        polygon_coords TEXT NOT NULL,
        center_lat DOUBLE NOT NULL,
        center_lon DOUBLE NOT NULL,
        detected_location VARCHAR(500),
        lang VARCHAR(10) DEFAULT 'en',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    await db.execute(sql`ALTER TABLE lands ADD COLUMN IF NOT EXISTS lang VARCHAR(10) DEFAULT 'en'`)
  } catch(e: any) { console.error('Table init error:', e.message) }
}
initTable()

router.post('/register', async (req, res) => {
  try {
    const { name, phone, email, landName, cropType, polygonCoords, centerLat, centerLon, detectedLocation, lang } = req.body
    if (!name || !phone || !email || !polygonCoords) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const coordsJson = JSON.stringify(polygonCoords)
    const lat = Number(centerLat)
    const lon = Number(centerLon)

    await db.execute(sql`
      INSERT INTO lands (farmer_name, phone, email, land_name, crop_type, polygon_coords, center_lat, center_lon, detected_location, lang)
      VALUES (${name}, ${phone}, ${email}, ${landName||null}, ${cropType||null}, ${coordsJson}, ${lat}, ${lon}, ${detectedLocation||null}, ${lang||'en'})
    `)

    const today = new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' })
    const results: string[] = []
    const warnings: string[] = []

    console.log("EMAIL CHECK:", !!process.env.BREVO_USER, !!process.env.BREVO_PASS)
    if (process.env.BREVO_USER && process.env.BREVO_PASS) {
      try {
        await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': process.env.BREVO_API_KEY || '',
        },
        body: JSON.stringify({
          sender: { name: 'KISAN-VISION', email: process.env.BREVO_SENDER_EMAIL || 'aravindhjoshua997@gmail.com' },
          to: [{ email }],
          subject: '✅ Land Registration Confirmed — KISAN-VISION',
          htmlContent: `<div style='font-family:Arial,sans-serif;max-width:500px;margin:0 auto;background:#030a03;color:#f0fdf4;border-radius:16px;overflow:hidden;border:1px solid #166534'><div style='background:#052e16;padding:24px;text-align:center'><h1 style='color:#4ade80;margin:0'>🌾 KISAN-VISION</h1></div><div style='padding:24px'><h2 style='color:#4ade80'>✅ Land Registered!</h2><p style='color:#86efac'>Dear ${name}, your land has been successfully registered.</p><p style='color:#86efac'>📍 ${detectedLocation || 'Your land'}</p><p style='color:#86efac'>📅 ${today}</p><p style='color:#86efac'>🗺️ ${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E</p><p style='color:#9ca3af'>Daily satellite reports will arrive at 6 AM every morning.</p></div></div>`
        })
      })
        results.push('Email sent')
      } catch (e: any) {
        warnings.push('Email failed: ' + (e.message || 'Unknown error'))
      }
    }

    console.log("TWILIO CHECK:", !!twilioClient, "phone:", phone)
    if (twilioClient) {
      try {
        await twilioClient.messages.create({
          from: process.env.TWILIO_WHATSAPP_FROM,
          to: `whatsapp:${phone}`,
          body: `🌾 KISAN-VISION

Your land has been registered successfully.
Thank you, ${name}!

We will share daily satellite reports to ${email}.`
        })
        results.push('WhatsApp sent')
      } catch (e: any) {
        warnings.push('WhatsApp failed: ' + (e.message || 'Unknown error'))
      }
    }

    const responsePayload: any = { success: true, message: 'Land registered successfully', details: results }
    if (warnings.length) responsePayload.warnings = warnings
    res.json(responsePayload)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Registration failed'
    console.error('Land register error:', message)
    res.status(500).json({ error: 'Registration failed: ' + message })
  }
})

router.get('/all', async (_req, res) => {
  try {
    const lands = await db.execute(sql`SELECT * FROM lands ORDER BY created_at DESC`)
    res.json({ success: true, lands: lands[0] })
  } catch {
    res.status(500).json({ error: 'Failed to fetch lands' })
  }
})

router.post('/send-reports', async (_req, res) => {
  try {
    const { sendDailyReports } = await import('../services/dailyReport')
    await sendDailyReports()
    res.json({ success: true, message: 'Reports sent' })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to send reports'
    res.status(500).json({ error: message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    await db.execute(sql`DELETE FROM lands WHERE id = ${id}`)
    res.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete land'
    res.status(500).json({ error: message })
  }
})

export default router
