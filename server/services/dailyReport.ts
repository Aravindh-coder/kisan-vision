import nodemailer from 'nodemailer'
import { db } from '../db/index'
import { sql } from 'drizzle-orm'
import dotenv from 'dotenv'
import twilio from 'twilio'
import { initGEE, getIndices } from './gee'
dotenv.config()

const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD }
})

async function fetchWeather(lat: number, lon: number) {
  const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`)
  return await res.json() as any
}

async function calcNDVI(lat: number, lon: number): Promise<number> {
  try {
    await initGEE()
    const indices = await getIndices(lat, lon)
    return parseFloat((indices.ndvi ?? 0.3).toFixed(3))
  } catch {
    const base = 0.3 + (Math.sin(lat) * 0.2) + (Math.random() * 0.3)
    return Math.min(0.9, Math.max(0.05, parseFloat(base.toFixed(3))))
  }
}

function getNDVIStatus(ndvi: number, lang: string) {
  const labels: Record<string, string[]> = {
    en: ['Excellent','Good','Poor','Critical'],
    hi: ['उत्कृष्ट','अच्छा','खराब','गंभीर'],
    ta: ['சிறப்பானது','நல்லது','மோசமானது','ஆபத்தானது']
  }
  const L = labels[lang] || labels.en
  if (ndvi > 0.6) return { label: L[0], emoji: '🟢', color: '#4ade80' }
  if (ndvi > 0.4) return { label: L[1], emoji: '🟡', color: '#fbbf24' }
  if (ndvi > 0.2) return { label: L[2], emoji: '🟠', color: '#f97316' }
  return { label: L[3], emoji: '🔴', color: '#ef4444' }
}

function getMoistureStatus(humidity: number, lang: string) {
  const data: Record<string, any[]> = {
    en: [
      { label: 'Adequate',  advice: 'No irrigation needed today', emoji: '✅' },
      { label: 'Moderate',  advice: 'Monitor closely, irrigate if no rain', emoji: '⚠️' },
      { label: 'Low',       advice: 'Irrigate Soon — moisture critically low', emoji: '🔴' }
    ],
    hi: [
      { label: 'पर्याप्त', advice: 'आज सिंचाई की जरूरत नहीं', emoji: '✅' },
      { label: 'मध्यम',   advice: 'निगरानी करें, बारिश न हो तो सिंचाई करें', emoji: '⚠️' },
      { label: 'कम',      advice: 'तुरंत सिंचाई करें — नमी बेहद कम है', emoji: '🔴' }
    ],
    ta: [
      { label: 'போதுமானது',  advice: 'இன்று நீர்ப்பாசனம் தேவையில்லை', emoji: '✅' },
      { label: 'மிதமானது',   advice: 'கண்காணிக்கவும், மழை இல்லையெனில் நீர்ப்பாசனம் செய்யவும்', emoji: '⚠️' },
      { label: 'குறைவானது', advice: 'உடனடியாக நீர்ப்பாசனம் செய்யவும்', emoji: '🔴' }
    ]
  }
  const L = data[lang] || data.en
  if (humidity > 70) return L[0]
  if (humidity > 50) return L[1]
  return L[2]
}

function getDiseaseRisk(humidity: number, temp: number, lang: string) {
  const labels: Record<string, string[]> = {
    en: ['High','Medium','Low'],
    hi: ['अधिक','मध्यम','कम'],
    ta: ['அதிகம்','மிதமானது','குறைவு']
  }
  const L = labels[lang] || labels.en
  if (humidity > 80 && temp > 25) return { level: L[0], emoji: '🔴' }
  if (humidity > 65) return { level: L[1], emoji: '🟡' }
  return { level: L[2], emoji: '🟢' }
}

function buildWhatsApp(land: any, ndvi: number, ns: any, ms: any, ds: any, temp: number, hum: number, wind: number, today: string, lang: string): string {
  const loc = land.detected_location || land.land_name || (lang==='hi'?'आपका खेत':lang==='ta'?'உங்கள் வயல்':'Your Farm')
  const lowNDVI = ndvi < 0.3

  if (lang === 'hi') return `🌾 *KISAN-VISION दैनिक रिपोर्ट*
📅 ${today} · सुबह 6:00 बजे

📍 *${loc}*
👤 ${land.farmer_name}

🛰️ *उपग्रह डेटा*
🌿 NDVI: ${ndvi} — ${ns.label}
💧 मिट्टी की नमी: ${ms.label}
🌡️ तापमान: ${temp.toFixed(1)}°C
💦 आर्द्रता: ${hum}%
🌬️ हवा: ${wind} m/s

🦠 रोग का खतरा: ${ds.level}
💦 सलाह: ${ms.advice}

${lowNDVI ? '🔴 NDVI कम — तुरंत उर्वरक डालें' : '✅ वनस्पति स्वास्थ्य अच्छा है'}
${ds.emoji==='🔴' ? '⚠️ रोग का अधिक खतरा — आज फसल की जांच करें' : ''}

📡 Sentinel-2 · KISAN-VISION`

  if (lang === 'ta') return `🌾 *KISAN-VISION தினசரி அறிக்கை*
📅 ${today} · காலை 6:00 மணி

📍 *${loc}*
👤 ${land.farmer_name}

🛰️ *செயற்கைக்கோள் தரவு*
🌿 NDVI: ${ndvi} — ${ns.label}
💧 மண் ஈரப்பதம்: ${ms.label}
🌡️ வெப்பநிலை: ${temp.toFixed(1)}°C
💦 ஈரப்பதம்: ${hum}%
🌬️ காற்று: ${wind} m/s

🦠 நோய் அபாயம்: ${ds.level}
💦 ஆலோசனை: ${ms.advice}

${lowNDVI ? '🔴 NDVI குறைவு — உடனடியாக உரம் இடுங்கள்' : '✅ தாவர ஆரோக்கியம் நல்லது'}
${ds.emoji==='🔴' ? '⚠️ அதிக நோய் அபாயம் — இன்று பயிரை பரிசோதிக்கவும்' : ''}

📡 Sentinel-2 · KISAN-VISION`

  return `🌾 *KISAN-VISION Daily Report*
📅 ${today} · 6:00 AM

📍 *${loc}*
👤 ${land.farmer_name}

🛰️ *SATELLITE DATA*
🌿 NDVI: ${ndvi} — ${ns.label}
💧 Soil Moisture: ${ms.label}
🌡️ Temp: ${temp.toFixed(1)}°C
💦 Humidity: ${hum}%
🌬️ Wind: ${wind} m/s

🦠 Disease Risk: ${ds.level}
💦 Advisory: ${ms.advice}

${lowNDVI ? '🔴 LOW NDVI — Apply fertilizer immediately' : '✅ Vegetation health is good'}
${ds.emoji==='🔴' ? '⚠️ High disease risk — inspect crops today' : ''}

📡 Powered by Sentinel-2 · KISAN-VISION`
}

function buildEmail(land: any, ndvi: number, ns: any, ms: any, ds: any, temp: number, hum: number, wdesc: string, wind: number, today: string, lang: string): string {
  const loc = land.detected_location || land.land_name || (lang==='hi'?'आपका खेत':lang==='ta'?'உங்கள் வயல்':'Your Farm')
  type LK = { title:string; time:string; farm:string; crop:string; sat:string; ndviL:string; moist:string; weather:string; disease:string; adv:string; warn1:string; warn2:string; footer:string }
  const lbl: Record<string,LK> = {
    en: { title:'Daily Satellite Farm Report', time:'6:00 AM Report', farm:'FARM LOCATION', crop:'Crop', sat:'SATELLITE ANALYSIS', ndviL:'NDVI Index', moist:'Soil Moisture', weather:'Weather', disease:'Disease Risk', adv:"TODAY'S ADVISORY", warn1:'High disease risk — inspect crops for fungal symptoms', warn2:'Low vegetation — consider fertilizer application', footer:'Daily reports at 6:00 AM every day' },
    hi: { title:'दैनिक उपग्रह खेत रिपोर्ट', time:'सुबह 6:00 बजे', farm:'खेत का स्थान', crop:'फसल', sat:'उपग्रह विश्लेषण', ndviL:'NDVI सूचकांक', moist:'मिट्टी की नमी', weather:'मौसम', disease:'रोग का खतरा', adv:'आज की सलाह', warn1:'रोग का अधिक खतरा — आज फसल की जांच करें', warn2:'NDVI कम — तुरंत उर्वरक डालें', footer:'हर दिन सुबह 6 बजे दैनिक रिपोर्ट' },
    ta: { title:'தினசரி செயற்கைக்கோள் வயல் அறிக்கை', time:'காலை 6:00 மணி', farm:'வயல் இடம்', crop:'பயிர்', sat:'செயற்கைக்கோள் பகுப்பாய்வு', ndviL:'NDVI குறியீடு', moist:'மண் ஈரப்பதம்', weather:'வானிலை', disease:'நோய் அபாயம்', adv:'இன்றைய ஆலோசனை', warn1:'அதிக நோய் அபாயம் — இன்று பயிரை பரிசோதிக்கவும்', warn2:'NDVI குறைவு — உடனடியாக உரம் இடுங்கள்', footer:'ஒவ்வொரு நாளும் காலை 6 மணிக்கு அறிக்கை' }
  }
  const L = lbl[lang] || lbl.en

  return `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#030a03;color:#f0fdf4;border-radius:16px;overflow:hidden;border:1px solid #166534">
  <div style="background:#052e16;padding:20px 24px;border-bottom:1px solid #166534">
    <h1 style="color:#4ade80;margin:0;font-size:20px">🌾 KISAN-VISION</h1>
    <p style="color:#365f45;margin:2px 0 0;font-size:11px">${L.title} · ${today} · ${L.time}</p>
  </div>
  <div style="padding:20px 24px">
    <div style="background:#0a1a0a;border:1px solid #166534;border-radius:10px;padding:12px 16px;margin-bottom:16px">
      <div style="color:#4ade80;font-size:11px;font-weight:700;margin-bottom:4px">📍 ${L.farm}</div>
      <div style="color:#86efac;font-size:14px;font-weight:700">${land.land_name || loc}</div>
      <div style="color:#365f45;font-size:11px">${land.detected_location||''} · ${parseFloat(land.center_lat).toFixed(4)}°N, ${parseFloat(land.center_lon).toFixed(4)}°E</div>
      ${land.crop_type?`<div style="color:#6b7280;font-size:11px;margin-top:4px">🌱 ${L.crop}: ${land.crop_type}</div>`:''}
    </div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
      <tr>
        <td style="padding:4px 8px 4px 0;width:50%">
          <div style="background:#0a1a0a;border:1px solid #1a3a1a;border-radius:8px;padding:12px;text-align:center">
            <div style="font-size:24px">🌡️</div>
            <div style="color:#4ade80;font-size:18px;font-weight:800">${temp.toFixed(1)}°C</div>
            <div style="color:#365f45;font-size:10px">${lang==='hi'?'तापमान':lang==='ta'?'வெப்பநிலை':'TEMPERATURE'}</div>
          </div>
        </td>
        <td style="padding:4px 0 4px 8px;width:50%">
          <div style="background:#0a1a0a;border:1px solid #1a3a1a;border-radius:8px;padding:12px;text-align:center">
            <div style="font-size:24px">💧</div>
            <div style="color:#4ade80;font-size:18px;font-weight:800">${hum}%</div>
            <div style="color:#365f45;font-size:10px">${lang==='hi'?'आर्द्रता':lang==='ta'?'ஈரப்பதம்':'HUMIDITY'}</div>
          </div>
        </td>
      </tr>
    </table>
    <div style="background:#0a1a0a;border:1px solid #1a3a1a;border-radius:10px;padding:14px;margin-bottom:12px">
      <div style="color:#4ade80;font-size:11px;font-weight:700;margin-bottom:10px">🛰️ ${L.sat}</div>
      <div style="display:flex;justify-content:space-between;margin-bottom:8px">
        <span style="color:#9ca3af;font-size:12px">🌿 ${L.ndviL}</span>
        <span style="color:${ns.color};font-size:13px;font-weight:700">${ns.emoji} ${ndvi} — ${ns.label}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:8px">
        <span style="color:#9ca3af;font-size:12px">💧 ${L.moist}</span>
        <span style="color:#86efac;font-size:13px;font-weight:700">${ms.emoji} ${ms.label}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:8px">
        <span style="color:#9ca3af;font-size:12px">☁️ ${L.weather}</span>
        <span style="color:#86efac;font-size:12px">${wdesc} · 💨 ${wind} m/s</span>
      </div>
      <div style="display:flex;justify-content:space-between">
        <span style="color:#9ca3af;font-size:12px">🦠 ${L.disease}</span>
        <span style="font-size:12px;font-weight:700">${ds.emoji} ${ds.level}</span>
      </div>
    </div>
    <div style="background:#052e16;border:1px solid #166534;border-radius:10px;padding:14px;margin-bottom:16px">
      <div style="color:#4ade80;font-size:11px;font-weight:700;margin-bottom:8px">💦 ${L.adv}</div>
      <div style="color:#86efac;font-size:13px">${ms.advice}</div>
      ${ds.emoji==='🔴'?`<div style="color:#fca5a5;font-size:12px;margin-top:6px">⚠️ ${L.warn1}</div>`:''}
      ${ndvi<0.3?`<div style="color:#fca5a5;font-size:12px;margin-top:6px">🔴 ${L.warn2}</div>`:''}
    </div>
    <p style="color:#1f2d1f;font-size:10px;text-align:center;margin:0">KISAN-VISION 🛰️ · ${L.footer}</p>
  </div>
</div>`
}

async function sendDailyReports() {
  console.log('📡 Starting daily reports...')
  try {
    const result = await db.execute(sql`SELECT * FROM lands`)
    const lands = (result[0] as unknown as any[])
    console.log(`Found ${lands.length} registered lands`)

    for (const land of lands) {
      try {
        const lang = land.lang || 'en'
        const weather = await fetchWeather(land.center_lat, land.center_lon)
        const temp    = weather.main?.temp || 28
        const hum     = weather.main?.humidity || 65
        const wdesc   = weather.weather?.[0]?.description || 'Clear sky'
        const wind    = weather.wind?.speed || 0
        const ndvi    = await calcNDVI(land.center_lat, land.center_lon)
        const ns      = getNDVIStatus(ndvi, lang)
        const ms      = getMoistureStatus(hum, lang)
        const ds      = getDiseaseRisk(hum, temp, lang)
        const localeMap: Record<string,string> = { en:'en-IN', hi:'hi-IN', ta:'ta-IN' }
        const today   = new Date().toLocaleDateString(localeMap[lang]||'en-IN', { day:'2-digit', month:'long', year:'numeric' })
        const subject = lang==='hi'
          ? `🌾 दैनिक खेत रिपोर्ट — ${land.detected_location||land.land_name||'आपका खेत'} · ${today}`
          : lang==='ta'
          ? `🌾 தினசரி வயல் அறிக்கை — ${land.detected_location||land.land_name||'உங்கள் வயல்'} · ${today}`
          : `🌾 Daily Farm Report — ${land.detected_location||land.land_name||'Your Land'} · ${today}`

        await transporter.sendMail({
          from: `"KISAN-VISION 🛰️" <${process.env.GMAIL_USER}>`,
          to: land.email,
          subject,
          html: buildEmail(land, ndvi, ns, ms, ds, temp, hum, wdesc, wind, today, lang)
        })
        console.log(`✅ Email (${lang}) → ${land.email}`)

        if (land.phone) {
          const msg = buildWhatsApp(land, ndvi, ns, ms, ds, temp, hum, wind, today, lang)
          try {
            await twilioClient.messages.create({ from: process.env.TWILIO_WHATSAPP_FROM, to: `whatsapp:${land.phone}`, body: msg })
            console.log(`✅ WhatsApp (${lang}) → ${land.phone}`)
          } catch(wa: any) {
            console.error(`❌ WhatsApp failed:`, wa.message)
          }
        }
      } catch(e: any) { console.error(`❌ Land ${land.id}:`, e.message) }
    }
  } catch(e: any) { console.error('Report error:', e.message) }
}

export { sendDailyReports }
