import express from 'express'
import fs from 'fs'
import path from 'path'
import twilio from 'twilio'
import dotenv from 'dotenv'
dotenv.config()

const router = express.Router()
const DB_FILE = path.join(__dirname, '../db/subscribers.json')

const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null

function saveSubscriber(data: any) {
  try {
    let list: any[] = []
    try {
      if (fs.existsSync(DB_FILE)) {
        list = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'))
      }
    } catch { }
    const idx = list.findIndex((s: any) => s.phone === data.phone || s.email === data.email)
    const entry = { ...data, id: Date.now().toString(), createdAt: new Date().toISOString() }
    if (idx >= 0) list[idx] = entry
    else list.push(entry)
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true })
    fs.writeFileSync(DB_FILE, JSON.stringify(list, null, 2))
  } catch (e) {
    console.warn('saveSubscriber skipped:', (e as any)?.message)
  }
}

async function getWeather(lat: number, lon: number) {
  const key = process.env.OPENWEATHER_API_KEY
  const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${key}&units=metric`)
  return await res.json() as any
}

async function sendBrevoEmail(to: string, subject: string, htmlContent: string) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': process.env.BREVO_API_KEY || '',
    },
    body: JSON.stringify({
      sender: { name: 'KISAN-VISION 🛰️', email: 'aravindhjoshua997@gmail.com' },
      to: [{ email: to }],
      subject,
      htmlContent,
    })
  })
  const data = await res.json() as any
  if (!res.ok) throw new Error(data?.message || 'Brevo API error')
  return data
}

router.post('/subscribe', async (req, res) => {
  try {
    const { phone, email, lat, lon, locationName, name } = req.body
    if (!lat || !lon) return res.status(400).json({ error: 'Location required' })
    if (!phone && !email) return res.status(400).json({ error: 'Phone or email required' })

    saveSubscriber({
      name: name || 'Farmer', phone: phone || '', email: email || '',
      lat, lon, locationName: locationName || `${lat}, ${lon}`
    })

    const weather = await getWeather(lat, lon)
    const temp = weather.main?.temp
    const humidity = weather.main?.humidity
    const description = weather.weather?.[0]?.description
    const wind = weather.wind?.speed
    const rain = weather.rain?.['1h'] || 0
    const irrigation = humidity > 70 || rain > 2 ? 'No irrigation needed today' : 'Irrigation recommended today'
    const loc = locationName || `${lat}, ${lon}`
    const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })

    const whatsappMsg = `🌾 *KISAN-VISION Daily Report*
📍 ${loc}
📅 ${today}
🌡️ Temp: ${temp}°C
💧 Humidity: ${humidity}%
🌬️ Wind: ${wind} m/s
🌤️ ${description}
🌧️ Rainfall: ${rain}mm
💦 ${irrigation}

Powered by KISAN-VISION 🛰️`

    const htmlMsg = `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;background:#030a03;color:#f0fdf4;border-radius:16px;overflow:hidden;border:1px solid #166534">
        <div style="background:#052e16;padding:24px;text-align:center;border-bottom:1px solid #166534">
          <h1 style="color:#4ade80;margin:0;font-size:22px">🌾 KISAN-VISION</h1>
          <p style="color:#365f45;margin:4px 0 0;font-size:12px">Daily Weather & Farm Report</p>
        </div>
        <div style="padding:24px">
          <h2 style="color:#4ade80;margin:0 0 4px">📍 ${loc}</h2>
          <p style="color:#365f45;font-size:12px;margin:0 0 20px">📅 ${today}</p>
          <div style="background:#052e16;border:1px solid #166534;border-radius:10px;padding:16px;margin-bottom:16px">
            <p style="color:#4ade80;margin:0 0 10px;font-size:13px;font-weight:700">🌡️ WEATHER CONDITIONS</p>
            <p style="color:#86efac;margin:4px 0;font-size:13px">🌡️ Temperature: <strong>${temp}°C</strong></p>
            <p style="color:#86efac;margin:4px 0;font-size:13px">💧 Humidity: <strong>${humidity}%</strong></p>
            <p style="color:#86efac;margin:4px 0;font-size:13px">🌬️ Wind Speed: <strong>${wind} m/s</strong></p>
            <p style="color:#86efac;margin:4px 0;font-size:13px">🌤️ Condition: <strong>${description}</strong></p>
            <p style="color:#86efac;margin:4px 0;font-size:13px">🌧️ Rainfall: <strong>${rain}mm</strong></p>
          </div>
          <div style="background:#0c1a0c;border:1px solid #1a3a1a;border-radius:10px;padding:16px">
            <p style="color:#4ade80;margin:0 0 8px;font-size:13px;font-weight:700">💦 IRRIGATION ADVISORY</p>
            <p style="color:#86efac;margin:0;font-size:14px;font-weight:700">${irrigation}</p>
          </div>
          <p style="color:#365f45;font-size:11px;text-align:center;margin-top:20px">KISAN-VISION 🛰️ · Sentinel-2 + OpenWeatherMap · Daily at 6 AM</p>
        </div>
      </div>`

    const results: string[] = []
    const warnings: string[] = []

    // WhatsApp via Twilio
    if (phone && twilioClient) {
      try {
        await twilioClient.messages.create({
          from: process.env.TWILIO_WHATSAPP_FROM,
          to: `whatsapp:${phone}`,
          body: whatsappMsg
        })
        results.push('WhatsApp sent')
      } catch (e: any) {
        console.error('WhatsApp error:', e.message)
        warnings.push('WhatsApp failed: ' + e.message)
      }
    }

    // Email via Brevo HTTP API
    if (email && process.env.BREVO_API_KEY) {
      try {
        await sendBrevoEmail(email, `🌾 KISAN-VISION Daily Report — ${loc}`, htmlMsg)
        results.push('Email sent')
      } catch (e: any) {
        console.error('Email error:', e.message)
        warnings.push('Email failed: ' + e.message)
      }
    }

    const payload: any = { success: true, message: results.join(' & ') || 'Subscribed!' }
    if (warnings.length) payload.warnings = warnings
    res.json(payload)

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
    } catch { }
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
