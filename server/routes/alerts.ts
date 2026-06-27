import express from 'express'
import fs from 'fs'
import path from 'path'
import twilio from 'twilio'
import nodemailer from 'nodemailer'

const router = express.Router()
const DB_FILE = path.join(__dirname, '../db/subscribers.json')

function saveSubscriber(data: any) {
  try {
    let list: any[] = []
    try {
      if (fs.existsSync(DB_FILE)) {
        list = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'))
      }
    } catch {}
    const idx = list.findIndex((s: any) => s.phone === data.phone || s.email === data.email)
    const entry = { ...data, id: Date.now().toString(), createdAt: new Date().toISOString() }
    if (idx >= 0) list[idx] = entry
    else list.push(entry)
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true })
    fs.writeFileSync(DB_FILE, JSON.stringify(list, null, 2))
  } catch (e) {
    console.warn('saveSubscriber skipped (read-only fs):', (e as any)?.message)
  }
}

async function getWeather(lat: number, lon: number) {
  const key = process.env.OPENWEATHER_API_KEY
  const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${key}&units=metric`)
  return await res.json() as any
}

router.post('/subscribe', async (req, res) => {
  try {
    const { phone, email, lat, lon, locationName, name } = req.body
    if (!lat || !lon) return res.status(400).json({ error: 'Location required' })
    if (!phone && !email) return res.status(400).json({ error: 'Phone or email required' })

    saveSubscriber({ name: name || 'Farmer', phone: phone || '', email: email || '', lat, lon, locationName: locationName || `${lat}, ${lon}` })

    const weather = await getWeather(lat, lon)
    const temp = weather.main?.temp
    const humidity = weather.main?.humidity
    const description = weather.weather?.[0]?.description
    const wind = weather.wind?.speed
    const rain = weather.rain?.['1h'] || 0
    const irrigation = humidity > 70 || rain > 2 ? 'No irrigation needed today' : 'Irrigation recommended today'

    const message = `🌾 *KISAN-VISION Daily Report*
📍 ${locationName || `${lat}, ${lon}`}
🌡️ Temp: ${temp}°C
💧 Humidity: ${humidity}%
🌬️ Wind: ${wind} m/s
🌤️ ${description}
💧 Rainfall: ${rain}mm

Advisory: ${irrigation}

Powered by KISAN-VISION 🛰️`

    const results: string[] = []

    if (phone) {
      const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
      await twilioClient.messages.create({
        from: process.env.TWILIO_WHATSAPP_FROM,
        to: `whatsapp:${phone}`,
        body: message
      })
      results.push('WhatsApp sent')
    }

    if (email) {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        family: 4,
        auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD }
      } as any)
      await transporter.sendMail({
        from: `"Kisan-Vision 🌾" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: `🌾 KISAN-VISION Daily Report - ${locationName}`,
        text: message
      })
      results.push('Email sent')
    }

    res.json({ success: true, message: results.join(' & ') + ' successfully!' })
  } catch (err: any) {
    console.error('ALERT ERROR:', err?.message || err)
    res.status(500).json({ error: err?.message || 'Alert failed' })
  }
})


router.post('/unsubscribe', async (req, res) => {
  try {
    const { contact } = req.body
    if (!contact) return res.status(400).json({ error: 'Contact required' })
    let list: any[] = []
    try {
      if (fs.existsSync(DB_FILE)) list = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'))
    } catch {}
    const before = list.length
    list = list.filter((s: any) => s.phone !== contact && s.email !== contact)
    if (list.length === before) return res.status(404).json({ error: 'Subscriber not found' })
    fs.writeFileSync(DB_FILE, JSON.stringify(list, null, 2))
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed' })
  }
})

export default router
