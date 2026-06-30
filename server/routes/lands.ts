import express from 'express'
import { db } from '../db/index'
import { sql } from 'drizzle-orm'
import nodemailer from 'nodemailer'
import twilio from 'twilio'
import dotenv from 'dotenv'
dotenv.config()

const router = express.Router()

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD }
})

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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
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

    await db.execute(sql`
      INSERT INTO lands (farmer_name, phone, email, land_name, crop_type, polygon_coords, center_lat, center_lon, detected_location, lang)
      VALUES (${name}, ${phone}, ${email}, ${landName||null}, ${cropType||null}, ${coordsJson}, ${centerLat}, ${centerLon}, ${detectedLocation||null}, ${lang||'en'})
    `)

    const today = new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' })
    const results: string[] = []

    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      await transporter.sendMail({
        from: `"KISAN-VISION 🛰️" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: '✅ Land Registration Confirmed — KISAN-VISION',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;background:#030a03;color:#f0fdf4;border-radius:16px;overflow:hidden;border:1px solid #166534">
            <div style="background:#052e16;padding:24px;text-align:center;border-bottom:1px solid #166534">
              <h1 style="color:#4ade80;margin:0;font-size:22px">🌾 KISAN-VISION</h1>
              <p style="color:#365f45;margin:4px 0 0;font-size:12px">Satellite-Powered Precision Agriculture</p>
            </div>
            <div style="padding:24px">
              <h2 style="color:#4ade80;margin:0 0 16px">✅ Land Registration Confirmed!</h2>
              <p style="color:#86efac;margin:0 0 20px">Dear <strong>${name}</strong>, your land has been successfully registered.</p>
              <div style="background:#052e16;border:1px solid #166534;border-radius:10px;padding:16px;margin-bottom:20px">
                <p style="color:#4ade80;margin:0 0 10px;font-size:13px;font-weight:700">📋 REGISTRATION DETAILS</p>
                <p style="color:#86efac;margin:4px 0;font-size:13px">👤 Name: <strong>${name}</strong></p>
                <p style="color:#86efac;margin:4px 0;font-size:13px">📱 WhatsApp: <strong>${phone}</strong></p>
                <p style="color:#86efac;margin:4px 0;font-size:13px">📍 Location: <strong>${detectedLocation || 'Your registered land'}</strong></p>
                ${landName ? `<p style="color:#86efac;margin:4px 0;font-size:13px">🌾 Farm: <strong>${landName}</strong></p>` : ''}
                ${cropType ? `<p style="color:#86efac;margin:4px 0;font-size:13px">🌱 Crop: <strong>${cropType}</strong></p>` : ''}
                <p style="color:#86efac;margin:4px 0;font-size:13px">📅 Date: <strong>${today}</strong></p>
                <p style="color:#86efac;margin:4px 0;font-size:13px">🗺️ Coordinates: <strong>${centerLat.toFixed(4)}°N, ${centerLon.toFixed(4)}°E</strong></p>
              </div>
              <div style="background:#0c1a0c;border:1px solid #1a3a1a;border-radius:10px;padding:16px;margin-bottom:20px">
                <p style="color:#4ade80;margin:0 0 10px;font-size:13px;font-weight:700">📡 DAILY REPORTS AT 6 AM INCLUDE</p>
                <p style="color:#9ca3af;margin:4px 0;font-size:12px">🌿 NDVI vegetation health index</p>
                <p style="color:#9ca3af;margin:4px 0;font-size:12px">💧 Soil moisture and stress levels</p>
                <p style="color:#9ca3af;margin:4px 0;font-size:12px">🛰️ Sentinel-2 satellite analysis</p>
                <p style="color:#9ca3af;margin:4px 0;font-size:12px">🌡️ Temperature and humidity forecast</p>
                <p style="color:#9ca3af;margin:4px 0;font-size:12px">💦 Smart irrigation advisory</p>
                <p style="color:#9ca3af;margin:4px 0;font-size:12px">⚠️ Disease and pest risk alerts</p>
              </div>
              <p style="color:#365f45;font-size:11px;text-align:center">KISAN-VISION 🛰️ · Sentinel-2 + OpenWeatherMap<br>Daily reports start tomorrow at 6:00 AM</p>
            </div>
          </div>
        `
      })
      results.push('Email sent')
    }

    if (twilioClient) {
      await twilioClient.messages.create({
        from: process.env.TWILIO_WHATSAPP_FROM,
        to: `whatsapp:${phone}`,
        body: `🌾 KISAN-VISION

Your land has been registered successfully.
Thank you, ${name}!

We will share daily satellite reports to ${email}.`
      })
      results.push('WhatsApp sent')
    }

    res.json({ success: true, message: 'Land registered successfully', details: results })
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

export default router

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
