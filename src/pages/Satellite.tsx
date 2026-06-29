import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import axios from 'axios'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Country, State, City } from 'country-state-city'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import Globe3D from '../components/Globe3D'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import LangSwitcher from '../components/LangSwitcher'
import { memo } from 'react'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function MapFlyTo({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => { map.flyTo(center, 10, { duration: 1.5 }) }, [center.toString()])
  return null
}

// AI GIRL ASSISTANT
function AIGirl({ result, onAsk, lang }: { result: any; onAsk: (q: string) => void; lang?: string }) {
  const userLang = lang || 'en'
  const [msg, setMsg] = useState(userLang === 'hi' ? 'नमस्ते! मैं KISAN AI हूं 🌾 ग्लोब पर कोई स्थान चुनें!' : userLang === 'ta' ? 'வணக்கம்! நான் KISAN AI 🌾 கோளத்தில் ஒரு இடத்தை தேர்ந்தெடுங்கள்!' : "Hello! I'm KISAN AI 🌾 Select a location on the globe or map and I'll analyze your land with satellite data!")
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(true)

  useEffect(() => {
    if (result) {
      const ndvi = result.ndvi
      const harvest = result.harvest?.estimatedHarvestDate
      const adv = result.advisory?.message || ''
      const hs = harvest ? (
        userLang==='hi' ? `कटाई अनुमानित: ${harvest}. ` :
        userLang==='ta' ? `அறுவடை தேதி: ${harvest}. ` :
        `Harvest expected around ${harvest}. `
      ) : ''
      if (ndvi > 0.6) setMsg(
        userLang==='hi'
          ? `उत्कृष्ट फसल स्वास्थ्य! 🌿 NDVI ${ndvi} — वनस्पति घनी और स्वस्थ। ${hs}कुछ भी पूछें!`
          : userLang==='ta'
          ? `சிறப்பான பயிர் ஆரோக்கியம்! 🌿 NDVI ${ndvi} — தாவரம் அடர்த்தியாக உள்ளது. ${hs}எதையும் கேளுங்கள்!`
          : `Excellent crop health! 🌿 NDVI ${ndvi} — vegetation is dense and thriving. ${hs}Ask me anything!`)
      else if (ndvi > 0.4) setMsg(
        userLang==='hi'
          ? `अच्छी वनस्पति 🌱 NDVI ${ndvi} मध्यम स्वास्थ्य। ${adv} क्या जानना चाहते हैं?`
          : userLang==='ta'
          ? `நல்ல தாவரம் 🌱 NDVI ${ndvi} மிதமான ஆரோக்கியம். ${adv} என்ன கேட்க விரும்புகிறீர்கள்?`
          : `Good vegetation 🌱 NDVI ${ndvi} shows moderate health. ${adv} What would you like to know?`)
      else if (ndvi > 0.2) setMsg(
        userLang==='hi'
          ? `⚠️ वनस्पति तनाव! NDVI ${ndvi} इष्टतम से नीचे। ${adv} तुरंत ध्यान दें!`
          : userLang==='ta'
          ? `⚠️ தாவர அழுத்தம்! NDVI ${ndvi} உகந்த அளவுக்கு கீழே. ${adv} உடனடி கவனம் தேவை!`
          : `⚠️ Vegetation stress! NDVI ${ndvi} below optimal. ${adv} Immediate attention needed!`)
      else setMsg(
        userLang==='hi'
          ? `🚨 गंभीर! NDVI ${ndvi} — बहुत कम वनस्पति। ${adv} तुरंत कार्रवाई करें!`
          : userLang==='ta'
          ? `🚨 ஆபத்து! NDVI ${ndvi} — மிகவும் குறைந்த தாவரம். ${adv} உடனடி நடவடிக்கை எடுங்கள்!`
          : `🚨 Critical! NDVI ${ndvi} — very low vegetation. ${adv} Please take immediate action!`)
    }
  }, [result, userLang])

  const ask = async () => {
    if (!input.trim()) return
    setLoading(true)
    const q = input
    setInput('')
    try {
      const context = result ? `Satellite data: NDVI=${result.ndvi}, NDWI=${result.ndwi}, EVI=${result.evi}, Advisory=${result.advisory?.status}, Crop=${result.cropEstimate?.likelyCrops?.join(',')}, Temp=${result.weather?.temp}°C, Humidity=${result.weather?.humidity}%, Wind=${result.weather?.wind_speed}m/s, Harvest=${result.harvest?.estimatedHarvestDate}` : 'No satellite data loaded yet'
      const groqRes = await fetch('/api/ai/groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'system', content: 'You are KISAN AI, expert agricultural scientist for Indian farming. Give detailed, actionable advice.' }, { role: 'user', content: 'Satellite data context: ' + context + '\n\nQuestion: ' + q }], max_tokens: 800, temperature: 0.7 })
      })
      const groqData = await groqRes.json()
      setMsg(groqData.choices?.[0]?.message?.content || 'I could not process that. Please try again.')
    } catch {
      setMsg('Connection error. But based on the satellite data I can see — ' + (result ? `NDVI is ${result.ndvi}, indicating ${result.advisory?.status}.` : 'please select a location first.'))
    }
    setLoading(false)
  }

  return (
    <div style={{
      position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000,
      display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px'
    }}>
      {expanded && (
        <div style={{
          width: '400px', background: 'rgba(2,10,2,0.97)', border: '1px solid rgba(74,222,128,0.3)',
          borderRadius: '20px', padding: '16px', backdropFilter: 'blur(20px)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 40px rgba(74,222,128,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80', animation: 'blink 1.5s infinite' }} />
            <span style={{ color: '#4ade80', fontSize: '12px', fontWeight: 700 }}>KISAN AI · LIVE</span>
            <button onClick={() => setExpanded(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#365f45', cursor: 'pointer', fontSize: '16px' }}>×</button>
          </div>
          <div style={{ background: 'rgba(22,101,52,0.15)', border: '1px solid rgba(74,222,128,0.1)', borderRadius: '12px', padding: '12px', marginBottom: '12px', minHeight: '80px', maxHeight: '280px', overflowY: 'auto' }}>
            <p style={{ color: '#d1fae5', fontSize: '13px', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{loading ? '🔍 Analyzing with Gemini AI...' : msg}</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && ask()}
              placeholder={userLang === 'hi' ? 'अपनी फसल के बारे में पूछें...' : userLang === 'ta' ? 'உங்கள் பயிரைப் பற்றி கேளுங்கள்...' : 'Ask about your crops...'}
              style={{ flex: 1, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '10px', padding: '8px 12px', color: '#f0fdf4', fontSize: '13px', outline: 'none' }}
            />
            <button onClick={ask} disabled={loading} style={{ background: '#16a34a', border: 'none', borderRadius: '10px', padding: '8px 14px', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}>→</button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
            {[
              userLang === 'hi' ? 'कब सिंचाई करें?' : userLang === 'ta' ? 'எப்போது நீர்ப்பாசனம்?' : 'When to irrigate?',
              userLang === 'hi' ? 'रोग का खतरा?' : userLang === 'ta' ? 'நோய் அபாயம்?' : 'Disease risk?',
              userLang === 'hi' ? 'सबसे अच्छा उर्वरक?' : userLang === 'ta' ? 'சிறந்த உரம்?' : 'Best fertilizer?',
              userLang === 'hi' ? 'कटाई की तारीख?' : userLang === 'ta' ? 'அறுவடை தேதி?' : 'Harvest date?'
            ].map(q => (
              <button key={q} onClick={() => { setInput(q); setTimeout(ask, 100) }}
                style={{ background: 'rgba(22,101,52,0.2)', border: '1px solid rgba(74,222,128,0.15)', borderRadius: '20px', padding: '4px 10px', color: '#86efac', fontSize: '11px', cursor: 'pointer' }}>
                {q}
              </button>
            ))}
          </div>
        </div>
      )}
      <button onClick={() => setExpanded(!expanded)} style={{
        width: '70px', height: '70px', borderRadius: '50%', border: '3px solid rgba(74,222,128,0.4)',
        background: 'linear-gradient(135deg, #052e16, #065f46)',
        boxShadow: '0 0 30px rgba(74,222,128,0.3)', cursor: 'pointer', fontSize: '32px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'float 3s ease-in-out infinite'
      }}>
        🌾
      </button>
    </div>
  )
}

// ANIMATED METRIC CARD
function MetricCard({ icon, label, value, sub, color, delay = 0 }: any) {
  return (
    <div style={{
      background: 'rgba(2,10,2,0.88)', border: `1px solid ${color}30`,
      borderRadius: '16px', padding: '20px', backdropFilter: 'blur(20px)',
      animation: `fadeUp 0.5s ease ${delay}s both`,
      position: 'relative', overflow: 'hidden'
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
      <div style={{ fontSize: '28px', marginBottom: '8px' }}>{icon}</div>
      <div style={{ color, fontSize: '26px', fontWeight: 800, marginBottom: '4px' }}>{value}</div>
      <div style={{ color: '#365f45', fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em' }}>{label}</div>
      {sub && <div style={{ color: '#6b7280', fontSize: '11px', marginTop: '4px' }}>{sub}</div>}
    </div>
  )
}

export default function Satellite() {
  const { token } = useAuth()
  const { t, lang: currentLang } = useLang()
  const navigate = useNavigate()
  const [selectedCountry, setSelectedCountry] = useState('')
  const [selectedState, setSelectedState] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [mapCenter, setMapCenter] = useState<[number, number]>([20.5937, 78.9629])
  const [flyTo, setFlyTo] = useState<[number, number] | null>(null)
  const [view, setView] = useState<'globe' | 'map'>('globe')
  const [marker, setMarker] = useState<{ lat: number; lon: number } | null>(null)
  const [result, setResult] = useState<any>(null)
  const [timeSeries, setTimeSeries] = useState<any[]>([])
  const [plantRecs, setPlantRecs] = useState<string>('')
  const [plantRecsLoading, setPlantRecsLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [particles] = useState(() => Array.from({ length: 20 }, (_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100,
    size: Math.random() * 3 + 1, duration: Math.random() * 8 + 4, delay: Math.random() * 4
  })))

  const countries = Country.getAllCountries()
  const states = selectedCountry ? State.getStatesOfCountry(selectedCountry) : []
  const cities = selectedState ? City.getCitiesOfState(selectedCountry, selectedState) : []

  const analyze = async (lat: number, lon: number) => {
    setLoading(true)
    setError('')
    setResult(null)
    setTimeSeries([])
    setPlantRecs('')
    try {
      const [satRes, tsRes] = await Promise.all([
        axios.get(`https://kisan-vision.onrender.com/api/satellite?lat=${lat}&lon=${lon}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`https://kisan-vision.onrender.com/api/satellite/timeseries?lat=${lat}&lon=${lon}`, { headers: { Authorization: `Bearer ${token}` } })
      ])
      setResult(satRes.data)
      setTimeSeries(tsRes.data.timeSeries || [])
    } catch (e: any) {
      setError(e.response?.data?.error || 'Analysis failed')
    }
    setLoading(false)
  }

  const handleGlobeSelect = (lat: number, lon: number) => {
    setMarker({ lat, lon })
    setMapCenter([lat, lon])
    analyze(lat, lon)
  }

  const handleCityChange = (city: string) => {
    setSelectedCity(city)
    const c = cities.find(x => x.name === city)
    if (c?.latitude && c?.longitude) {
      const lat = parseFloat(c.latitude)
      const lon = parseFloat(c.longitude)
      setMarker({ lat, lon })
      setFlyTo([lat, lon])
      analyze(lat, lon)
    }
  }

  const getNDVIColor = (ndvi: number) => {
    if (ndvi > 0.6) return '#4ade80'
    if (ndvi > 0.4) return '#86efac'
    if (ndvi > 0.2) return '#fbbf24'
    return '#ef4444'
  }

  const selectStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(0,0,0,0.5)', color: '#f0fdf4',
    border: '1px solid rgba(74,222,128,0.2)', borderRadius: '10px',
    padding: '10px 14px', fontSize: '13px', outline: 'none'
  }

  return (
    <div style={{ minHeight: '100vh', background: '#030a03', color: '#f0fdf4', fontFamily: 'system-ui, Arial, sans-serif', position: 'relative', overflow: 'hidden' }}>

      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes scan { 0%{top:0;opacity:0.5} 100%{top:100%;opacity:0} }
        @keyframes particle { 0%{transform:translateY(0) scale(1);opacity:0.6} 100%{transform:translateY(-100vh) scale(0);opacity:0} }
        @keyframes pulse-glow { 0%,100%{box-shadow:0 0 20px rgba(74,222,128,0.2)} 50%{box-shadow:0 0 40px rgba(74,222,128,0.4)} }
        @keyframes rotate { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes gridMove { 0%{background-position:0 0} 100%{background-position:60px 60px} }
        .hover-card:hover { border-color: rgba(74,222,128,0.4) !important; transform: translateY(-2px); transition: all 0.2s; }
        select option { background: #0a1a0a; }
      `}</style>

      {/* ANIMATED GRID BACKGROUND */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(74,222,128,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(74,222,128,0.03) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
        animation: 'gridMove 8s linear infinite'
      }} />

      {/* FLOATING PARTICLES */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        {particles.map(p => (
          <div key={p.id} style={{
            position: 'absolute', left: `${p.x}%`, bottom: '-10px',
            width: `${p.size}px`, height: `${p.size}px`,
            borderRadius: '50%', background: '#4ade80',
            opacity: 0.4, animation: `particle ${p.duration}s ${p.delay}s linear infinite`
          }} />
        ))}
      </div>

      {/* SCANLINE */}
      <div style={{
        position: 'fixed', left: 0, right: 0, height: '2px', zIndex: 2, pointerEvents: 'none',
        background: 'linear-gradient(90deg, transparent, rgba(74,222,128,0.5), transparent)',
        animation: 'scan 7s linear infinite'
      }} />

      {/* CORNER DECORATIONS */}
      <div style={{ position: 'fixed', top: '60px', left: 0, width: '200px', height: '200px', zIndex: 1, pointerEvents: 'none', background: 'radial-gradient(circle at top left, rgba(74,222,128,0.05), transparent 70%)' }} />
      <div style={{ position: 'fixed', bottom: 0, right: 0, width: '300px', height: '300px', zIndex: 1, pointerEvents: 'none', background: 'radial-gradient(circle at bottom right, rgba(74,222,128,0.04), transparent 70%)' }} />

      {/* NAVBAR */}
      <nav style={{
        position: 'relative', zIndex: 10, background: 'rgba(2,10,2,0.95)',
        borderBottom: '1px solid rgba(74,222,128,0.2)', padding: '0 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: '60px', backdropFilter: 'blur(20px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(22,101,52,0.8)', border: '1px solid rgba(74,222,128,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🛰️</div>
          <div>
            <div style={{ color: '#4ade80', fontSize: '16px', fontWeight: 800, letterSpacing: '0.05em' }}>KISAN-VISION</div>
            <div style={{ color: '#365f45', fontSize: '10px', letterSpacing: '0.1em' }}>SATELLITE INTELLIGENCE PLATFORM</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: '20px', padding: '5px 12px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', animation: 'blink 1.5s infinite', display: 'inline-block' }} />
            <span style={{ color: '#4ade80', fontSize: '11px', fontWeight: 700 }}>SENTINEL-2 LIVE</span>
          </div>
          <button onClick={() => navigate('/')} style={{ background: 'rgba(22,101,52,0.3)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)', borderRadius: '10px', padding: '7px 16px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>{t.dashboard}</button>
          <button onClick={() => navigate('/crop-detect')} style={{ background: 'rgba(22,101,52,0.8)', color: '#fff', border: 'none', borderRadius: '10px', padding: '7px 16px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>🌿 Crop Doctor</button>
          <button onClick={() => window.open('/my-lands.html', '_blank')} style={{ background: 'rgba(22,101,52,0.3)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)', borderRadius: '10px', padding: '7px 16px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>{t.myLands}</button>
          <button onClick={() => window.open('/weather-alert.html', '_blank')} style={{ background: 'rgba(234,179,8,0.2)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.4)', borderRadius: '10px', padding: '7px 16px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>🌡️ Weather Alert</button>
          <LangSwitcher />
          <button onClick={() => window.open('/land-map.html', '_blank')} style={{ background: 'rgba(22,163,74,0.8)', color: '#fff', border: 'none', borderRadius: '10px', padding: '7px 16px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>{t.registerLand}</button>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <div style={{ position: 'relative', zIndex: 3, maxWidth: '1400px', margin: '0 auto', padding: '32px 24px' }}>

        {/* HERO HEADER */}
        <div style={{ textAlign: 'center', marginBottom: '40px', animation: 'fadeUp 0.6s ease both' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(22,101,52,0.2)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '20px', padding: '6px 16px', marginBottom: '16px' }}>
            <span style={{ color: '#4ade80', fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em' }}>🛰️ POWERED BY SENTINEL-2 · SAR · OPENWEATHERMAP</span>
          </div>
          <h1 style={{ color: '#f0fdf4', fontSize: '40px', fontWeight: 900, letterSpacing: '-0.02em', margin: '0 0 8px', lineHeight: 1.1 }}>
            Satellite <span style={{ color: '#4ade80', position: 'relative' }}>Intelligence</span>
          </h1>
          <p style={{ color: '#365f45', fontSize: '15px', margin: 0 }}>Click any location on the globe · Get instant NDVI, SAR, weather & crop analysis</p>
        </div>

        {/* LOCATION SELECTOR + GLOBE */}
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px', marginBottom: '24px' }}>

          {/* LEFT PANEL */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

            {/* Location search */}
            <div style={{ background: 'rgba(2,10,2,0.88)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '16px', padding: '20px', backdropFilter: 'blur(20px)', animation: 'fadeUp 0.5s ease 0.1s both' }}>
              <div style={{ color: '#4ade80', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '14px' }}>📍 SELECT LOCATION</div>
              <select style={selectStyle} value={selectedCountry} onChange={e => { setSelectedCountry(e.target.value); setSelectedState(''); setSelectedCity('') }}>
                <option value="">— Country —</option>
                {countries.map(c => <option key={c.isoCode} value={c.isoCode}>{c.flag} {c.name}</option>)}
              </select>
              {selectedCountry && (
                <select style={{ ...selectStyle, marginTop: '8px' }} value={selectedState} onChange={e => { setSelectedState(e.target.value); setSelectedCity('') }}>
                  <option value="">— State —</option>
                  {states.map(s => <option key={s.isoCode} value={s.isoCode}>{s.name}</option>)}
                </select>
              )}
              {selectedState && (
                <select style={{ ...selectStyle, marginTop: '8px' }} value={selectedCity} onChange={e => handleCityChange(e.target.value)}>
                  <option value="">— District / City —</option>
                  {cities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
              )}
              {selectedCity && (
                <div style={{ marginTop: '12px', background: 'rgba(22,101,52,0.2)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '10px', padding: '10px 12px' }}>
                  <div style={{ color: '#365f45', fontSize: '10px', fontWeight: 700 }}>SELECTED</div>
                  <div style={{ color: '#4ade80', fontSize: '13px', fontWeight: 700 }}>📍 {selectedCity}</div>
                </div>
              )}
            </div>

            {/* View toggle */}
            <div style={{ background: 'rgba(2,10,2,0.88)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '16px', padding: '16px', backdropFilter: 'blur(20px)', animation: 'fadeUp 0.5s ease 0.2s both' }}>
              <div style={{ color: '#4ade80', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '10px' }}>🌍 MAP MODE</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['globe', 'map'].map(v => (
                  <button key={v} onClick={() => setView(v as any)} style={{
                    flex: 1, padding: '10px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', border: 'none',
                    background: view === v ? '#16a34a' : 'rgba(0,0,0,0.4)', color: view === v ? '#fff' : '#6b7280', transition: 'all 0.2s'
                  }}>
                    {v === 'globe' ? '🌍 Globe' : '🗺️ Map'}
                  </button>
                ))}
              </div>
            </div>

            {/* Stats when result */}
            {result && (
              <div style={{ background: 'rgba(2,10,2,0.88)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '16px', padding: '16px', backdropFilter: 'blur(20px)', animation: 'fadeUp 0.4s ease both' }}>
                <div style={{ color: '#4ade80', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '12px' }}>⚡ QUICK STATS</div>
                {[
                  { label: 'NDVI', value: result.ndvi?.toFixed(3), color: getNDVIColor(result.ndvi) },
                  { label: 'NDWI', value: result.ndwi?.toFixed(3), color: '#93c5fd' },
                  { label: 'EVI', value: result.evi?.toFixed(3), color: '#fbbf24' },
                  { label: 'Status', value: result.advisory?.status, color: '#4ade80' },
                ].map(s => (
                  <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(74,222,128,0.06)' }}>
                    <span style={{ color: '#6b7280', fontSize: '12px' }}>{s.label}</span>
                    <span style={{ color: s.color, fontSize: '12px', fontWeight: 700 }}>{s.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* GLOBE / MAP */}
          <div style={{ borderRadius: '20px', overflow: 'hidden', border: '1px solid rgba(74,222,128,0.2)', background: '#000', minHeight: '500px', animation: 'fadeUp 0.5s ease 0.15s both', position: 'relative' }}>
            {view === 'globe' ? (
              <Globe3D onLocationSelect={handleGlobeSelect} />
            ) : (
              <MapContainer center={mapCenter} zoom={8} style={{ height: '500px', width: '100%' }}>
                <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
                {flyTo && <MapFlyTo center={flyTo} />}
                {marker && (
                  <Marker position={[marker.lat, marker.lon]}>
                    <Popup>{selectedCity || 'Selected Location'}<br />{marker.lat.toFixed(4)}, {marker.lon.toFixed(4)}</Popup>
                  </Marker>
                )}
              </MapContainer>
            )}
            {loading && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(2,10,2,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                <div style={{ fontSize: '48px', animation: 'float 2s ease-in-out infinite', marginBottom: '16px' }}>🛰️</div>
                <div style={{ color: '#4ade80', fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>Scanning via Satellite...</div>
                <div style={{ color: '#365f45', fontSize: '12px' }}>Fetching NDVI · SAR · Weather · Crop data</div>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', padding: '14px 20px', color: '#f87171', marginBottom: '20px' }}>
            ⚠️ {error}
          </div>
        )}

        {/* RESULTS */}
        {result && !loading && (
          <>
            {/* LOCATION HEADER */}
            <div style={{ background: 'rgba(2,10,2,0.88)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '16px', padding: '20px 24px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', animation: 'fadeUp 0.4s ease both' }}>
              <div>
                <h2 style={{ color: '#4ade80', fontSize: '22px', fontWeight: 800, margin: '0 0 4px' }}>
                  📍 {selectedCity || `${marker?.lat.toFixed(4)}°N, ${marker?.lon.toFixed(4)}°E`}
                </h2>
                <p style={{ color: '#365f45', fontSize: '12px', margin: 0 }}>
                  {result.source || 'Sentinel-2'} · 10m Resolution · {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => window.open('/land-map.html', '_blank')} style={{ background: 'rgba(22,163,74,0.3)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)', borderRadius: '10px', padding: '8px 16px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                  ➕ Register This Land
                </button>
              </div>
            </div>

            {/* SATELLITE INDICES */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
              <MetricCard icon="🌿" label="NDVI — VEGETATION" value={result.ndvi?.toFixed(3)} sub={result.advisory?.status} color={getNDVIColor(result.ndvi)} delay={0} />
              <MetricCard icon="💧" label="NDWI — MOISTURE" value={result.ndwi?.toFixed(3)} sub="Water Index" color="#93c5fd" delay={0.05} />
              <MetricCard icon="🌱" label="EVI — ENHANCED VEG" value={result.evi?.toFixed(3)} sub="Sentinel-2 Band 8+4" color="#fbbf24" delay={0.1} />
              <MetricCard icon="🌾" label="SAVI — SOIL ADJ" value={result.savi?.toFixed(3)} sub="Soil Adjusted Index" color="#f97316" delay={0.15} />
            </div>

            {/* NDVI HEALTH BAR */}
            <div style={{ background: 'rgba(2,10,2,0.88)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '16px', padding: '20px', marginBottom: '20px', animation: 'fadeUp 0.5s ease 0.2s both' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ color: '#4ade80', fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em' }}>🌿 NDVI VEGETATION HEALTH SCALE</span>
                <span style={{ color: getNDVIColor(result.ndvi), fontSize: '13px', fontWeight: 700 }}>{result.ndvi?.toFixed(3)} — {result.advisory?.status}</span>
              </div>
              <div style={{ height: '14px', borderRadius: '7px', background: 'rgba(0,0,0,0.4)', overflow: 'hidden', marginBottom: '6px' }}>
                <div style={{ height: '100%', width: `${(result.ndvi * 100).toFixed(0)}%`, borderRadius: '7px', background: 'linear-gradient(90deg, #ef4444, #f97316, #fbbf24, #4ade80)', transition: 'width 1s ease' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#ef4444', fontSize: '10px' }}>0 — Bare/Urban</span>
                <span style={{ color: '#fbbf24', fontSize: '10px' }}>0.3 — Sparse</span>
                <span style={{ color: '#4ade80', fontSize: '10px' }}>0.6+ — Dense</span>
              </div>
            </div>

            {/* PLANTABILITY CARD */}
            {(() => {
              const pv = result.ndvi, pw = result.ndwi, pt = result.weather?.temp, ph = result.weather?.humidity
              let score = 0
              if (pv >= 0.2) score += 25; if (pw >= -0.1) score += 25
              if (pt >= 15 && pt <= 38) score += 25; if (ph >= 40 && ph <= 85) score += 25
              const col = score >= 75 ? '#4ade80' : score >= 50 ? '#fbbf24' : '#ef4444'
              const icon = score >= 75 ? '✅' : score >= 50 ? '⚠️' : '❌'
              const lbl = score >= 75 ? 'SUITABLE FOR PLANTING' : score >= 50 ? 'MARGINAL — NEEDS IMPROVEMENT' : 'NOT SUITABLE FOR PLANTING'
              const circ = 2 * Math.PI * 50
              return (
                <div style={{ background: 'rgba(2,10,2,0.88)', border: `2px solid ${col}40`, borderRadius: '16px', padding: '24px', marginBottom: '20px', animation: 'fadeUp 0.5s ease 0.22s both', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg,transparent,${col},transparent)` }} />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <span style={{ color: '#4ade80', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em' }}>🌱 LAND PLANTABILITY ASSESSMENT</span>
                    <div style={{ background: `${col}20`, border: `1px solid ${col}60`, borderRadius: '20px', padding: '6px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '18px' }}>{icon}</span>
                      <span style={{ color: col, fontSize: '13px', fontWeight: 800 }}>{lbl}</span>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '24px', alignItems: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 10px' }}>
                        <svg viewBox='0 0 120 120' style={{ width: '120px', height: '120px', transform: 'rotate(-90deg)' }}>
                          <circle cx='60' cy='60' r='50' fill='none' stroke='rgba(255,255,255,0.06)' strokeWidth='10'/>
                          <circle cx='60' cy='60' r='50' fill='none' stroke={col} strokeWidth='10'
                            strokeDasharray={`${circ}`} strokeDashoffset={`${circ*(1-score/100)}`}
                            strokeLinecap='round' style={{transition:'stroke-dashoffset 1s ease'}}/>
                        </svg>
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ color: col, fontSize: '28px', fontWeight: 900 }}>{score}%</div>
                          <div style={{ color: '#6b7280', fontSize: '10px' }}>SCORE</div>
                        </div>
                      </div>
                      <div style={{ color: '#365f45', fontSize: '11px' }}>Plantability Index</div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      {[
                        { label: 'NDVI', val: pv?.toFixed(3), ok: pv >= 0.2, tip: pv >= 0.2 ? 'Good' : 'Too low' },
                        { label: 'MOISTURE', val: pw?.toFixed(3), ok: pw >= -0.1, tip: pw >= -0.1 ? 'Adequate' : 'Dry' },
                        { label: 'TEMPERATURE', val: `${pt?.toFixed(1)}°C`, ok: pt >= 15 && pt <= 38, tip: pt >= 15 && pt <= 38 ? 'Optimal' : 'Extreme' },
                        { label: 'HUMIDITY', val: `${ph}%`, ok: ph >= 40 && ph <= 85, tip: ph >= 40 && ph <= 85 ? 'Good' : 'Poor' },
                      ].map(m => (
                        <div key={m.label} style={{ background: 'rgba(0,0,0,0.4)', border: `1px solid ${m.ok?'rgba(74,222,128,0.2)':'rgba(239,68,68,0.2)'}`, borderRadius: '10px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ color: '#365f45', fontSize: '9px', fontWeight: 700 }}>{m.label}</div>
                            <div style={{ color: '#f0fdf4', fontSize: '14px', fontWeight: 700 }}>{m.val}</div>
                          </div>
                          <span style={{ color: m.ok?'#4ade80':'#ef4444', fontSize: '11px', fontWeight: 700 }}>{m.ok?'✓':'✗'} {m.tip}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* WEATHER + SAR */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              {/* WEATHER */}
              <div style={{ background: 'rgba(2,10,2,0.88)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '16px', padding: '20px', animation: 'fadeUp 0.5s ease 0.25s both' }}>
                <div style={{ color: '#4ade80', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '16px' }}>🌡️ WEATHER CONDITIONS</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {[
                    { icon: '🌡️', label: 'TEMPERATURE', value: `${result.weather?.temp?.toFixed(1)}°C`, sub: `Feels ${result.weather?.feels_like?.toFixed(1)}°C` },
                    { icon: '💧', label: 'HUMIDITY', value: `${result.weather?.humidity}%`, sub: result.weather?.description },
                    { icon: '🌬️', label: 'WIND SPEED', value: `${result.weather?.wind_speed?.toFixed(1)} m/s`, sub: `${(result.weather?.wind_speed * 3.6).toFixed(1)} km/h` },
                    { icon: '🌧️', label: 'RAINFALL', value: `${result.weather?.rain?.toFixed(1) || '0.0'} mm`, sub: 'Last 1 hour' },
                    { icon: '📊', label: 'PRESSURE', value: `${result.weather?.pressure} hPa`, sub: 'Atmospheric' },
                    { icon: '☁️', label: 'CONDITION', value: result.weather?.description, sub: 'Current sky' },
                  ].map(w => (
                    <div key={w.label} style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(74,222,128,0.1)', borderRadius: '10px', padding: '12px' }}>
                      <div style={{ fontSize: '18px', marginBottom: '4px' }}>{w.icon}</div>
                      <div style={{ color: '#f0fdf4', fontSize: '15px', fontWeight: 700 }}>{w.value}</div>
                      <div style={{ color: '#365f45', fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em' }}>{w.label}</div>
                      <div style={{ color: '#6b7280', fontSize: '11px' }}>{w.sub}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SAR + CROP */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ background: 'rgba(2,10,2,0.88)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '16px', padding: '20px', animation: 'fadeUp 0.5s ease 0.3s both' }}>
                  <div style={{ color: '#4ade80', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '14px' }}>📡 SAR — SYNTHETIC APERTURE RADAR</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                    {[
                      { label: 'BACKSCATTER', value: `${result.sar?.backscatter} dB`, sub: 'C-Band VV' },
                      { label: 'SOIL MOISTURE', value: result.sar?.soilMoisture, sub: 'SAR Derived' },
                      { label: 'COHERENCE', value: result.sar?.coherence, sub: 'Surface Type' },
                    ].map(s => (
                      <div key={s.label} style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(74,222,128,0.1)', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                        <div style={{ color: '#93c5fd', fontSize: '14px', fontWeight: 700 }}>{s.value}</div>
                        <div style={{ color: '#365f45', fontSize: '9px', fontWeight: 700, letterSpacing: '0.06em' }}>{s.label}</div>
                        <div style={{ color: '#6b7280', fontSize: '10px' }}>{s.sub}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {result.cropEstimate?.isCropland && (
                  <div style={{ background: 'rgba(2,10,2,0.88)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: '16px', padding: '20px', animation: 'fadeUp 0.5s ease 0.35s both' }}>
                    <div style={{ color: '#fbbf24', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '10px' }}>🌾 CROP ESTIMATE — {result.cropEstimate.season}</div>
                    <div style={{ color: '#f0fdf4', fontSize: '20px', fontWeight: 800, marginBottom: '4px' }}>{result.cropEstimate.likelyCrops?.join(' · ')}</div>
                    <div style={{ color: '#6b7280', fontSize: '12px' }}>Based on latitude, NDVI and seasonal patterns</div>
                  </div>
                )}

                {result.harvest && (
                  <div style={{ background: 'rgba(2,10,2,0.88)', border: '1px solid rgba(251,146,60,0.3)', borderRadius: '16px', padding: '20px', animation: 'fadeUp 0.5s ease 0.4s both' }}>
                    <div style={{ color: '#fb923c', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '10px' }}>🗓️ HARVEST ESTIMATION</div>
                    <div style={{ color: '#fbbf24', fontSize: '20px', fontWeight: 800, marginBottom: '4px' }}>{result.harvest.estimatedHarvestDate}</div>
                    <div style={{ color: '#86efac', fontSize: '13px', marginBottom: '4px' }}>in {result.harvest.estimatedDays} days · {result.harvest.crop}</div>
                    <div style={{ color: '#6b7280', fontSize: '11px' }}>{result.harvest.message}</div>
                  </div>
                )}
              </div>
            </div>

            {/* ADVISORY */}
            <div style={{ background: 'rgba(5,46,22,0.5)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: '16px', padding: '20px', marginBottom: '20px', animation: 'fadeUp 0.5s ease 0.4s both' }}>
              <div style={{ color: '#4ade80', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '10px' }}>💡 AI ADVISORY</div>
              <div style={{ color: '#f0fdf4', fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>{result.advisory?.status}</div>
              <div style={{ color: '#86efac', fontSize: '14px' }}>{result.advisory?.message}</div>
            </div>

            {/* GROQ PLANT RECOMMENDATIONS */}
            <div style={{ background: 'rgba(2,10,2,0.88)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: '16px', padding: '24px', marginBottom: '20px', animation: 'fadeUp 0.5s ease 0.45s both', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg,transparent,#4ade80,transparent)' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <div style={{ color: '#4ade80', fontSize: '14px', fontWeight: 800, marginBottom: '4px' }}>🌱 WHAT CAN YOU PLANT HERE?</div>
                  <div style={{ color: '#365f45', fontSize: '12px' }}>Groq AI · Based on NDVI, weather, soil and season</div>
                </div>
                <button
                  onClick={async () => {
                    setPlantRecsLoading(true)
                    setPlantRecs('')
                    const loc = selectedCity || ((marker?.lat?.toFixed(4) || '0') + 'N ' + (marker?.lon?.toFixed(4) || '0') + 'E')
                    const ctx = 'Location:' + loc + ',NDVI:' + result.ndvi + ',NDWI:' + result.ndwi + ',EVI:' + result.evi + ',Temp:' + result.weather?.temp + 'C,Humidity:' + result.weather?.humidity + '%,Weather:' + result.weather?.description + ',LandCover:' + result.landCover + ',Season:' + result.cropEstimate?.season + ',Advisory:' + result.advisory?.status + ',SoilMoisture:' + result.sar?.soilMoisture
                    try {
                      const _gr = await fetch('/api/ai/groq', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'system', content: 'You are KISAN AI, expert agricultural scientist for Indian farming.' }, { role: 'user', content: 'Satellite data: ' + ctx + '\n\nProvide a planting guide: 1. TOP 8 CROPS TO PLANT NOW with reasons 2. CROPS TO AVOID with reasons 3. OPTIMAL PLANTING WINDOW 4. SOIL PREPARATION steps 5. EXPECTED YIELD per acre. Be specific for Indian farming context.' }], max_tokens: 1200, temperature: 0.7 })
                      })
                      const _gd = await _gr.json()
                      if (_gd.error) throw new Error(_gd.error.message)
                      setPlantRecs(_gd.choices[0].message.content)
                    } catch(e: any) { setPlantRecs('Error: ' + e.message) }
                    setPlantRecsLoading(false)
                  }}
                  disabled={plantRecsLoading}
                  style={{ background: plantRecsLoading ? 'rgba(75,85,99,0.4)' : 'linear-gradient(135deg,#16a34a,#065f46)', color: '#fff', border: 'none', borderRadius: '12px', padding: '10px 20px', fontSize: '13px', fontWeight: 800, cursor: plantRecsLoading ? 'wait' : 'pointer' }}
                >
                  {plantRecsLoading ? '🔍 Analyzing...' : '🤖 Ask Groq AI'}
                </button>
              </div>
              {plantRecsLoading ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#4ade80', fontSize: '14px' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px', animation: 'float 2s ease-in-out infinite' }}>🌱</div>
                  Groq AI is analyzing satellite data...
                </div>
              ) : plantRecs ? (
                <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(74,222,128,0.1)', borderRadius: '12px', padding: '16px', color: '#d1fae5', fontSize: '13px', lineHeight: 1.8, whiteSpace: 'pre-wrap', maxHeight: '400px', overflowY: 'auto' }}>
                  {plantRecs}
                </div>
              ) : (
                <div style={{ color: '#365f45', fontSize: '13px' }}>Click "Ask Groq AI" to get personalized crop recommendations for this exact location based on live satellite data →</div>
              )}
            </div>

            {/* 6-MONTH NDVI CHART */}
            {timeSeries.length > 0 && (
              <div style={{ background: 'rgba(2,10,2,0.88)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '16px', padding: '24px', marginBottom: '20px', animation: 'fadeUp 0.5s ease 0.45s both' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div>
                    <div style={{ color: '#4ade80', fontSize: '14px', fontWeight: 800, marginBottom: '4px' }}>📈 NDVI TREND — 12 MONTHS</div>
                    <div style={{ color: '#365f45', fontSize: '12px' }}>Vegetation health over time for this location</div>
                  </div>
                  <div style={{ background: 'rgba(22,101,52,0.2)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '8px', padding: '6px 14px' }}>
                    <span style={{ color: '#4ade80', fontSize: '12px', fontWeight: 700 }}>Current: {result.ndvi?.toFixed(3)}</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={timeSeries}>
                    <defs>
                      <linearGradient id="ndviGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(74,222,128,0.08)" />
                    <XAxis dataKey="month" stroke="#365f45" tick={{ fill: '#6b7280', fontSize: 11 }} />
                    <YAxis stroke="#365f45" domain={[0, 1]} tick={{ fill: '#6b7280', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: 'rgba(2,10,2,0.95)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: '10px', color: '#f0fdf4' }} />
                    <Area type="monotone" dataKey="ndvi" stroke="#4ade80" strokeWidth={2.5} fill="url(#ndviGrad)" dot={{ fill: '#4ade80', r: 4 }} />
                    {timeSeries[0]?.ndwi !== undefined && (
                      <Area type="monotone" dataKey="ndwi" stroke="#93c5fd" strokeWidth={2} fill="none" dot={{ fill: '#93c5fd', r: 3 }} />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', gap: '16px', marginTop: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '3px', background: '#4ade80', borderRadius: '2px' }} /><span style={{ color: '#6b7280', fontSize: '11px' }}>NDVI</span></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '3px', background: '#93c5fd', borderRadius: '2px' }} /><span style={{ color: '#6b7280', fontSize: '11px' }}>NDWI</span></div>
                </div>
              </div>
            )}
          </>
        )}

        {/* EMPTY STATE */}
        {!result && !loading && (
          <div style={{ textAlign: 'center', padding: '60px 20px', animation: 'fadeUp 0.6s ease 0.3s both' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px', animation: 'float 4s ease-in-out infinite' }}>🌍</div>
            <h3 style={{ color: '#4ade80', fontSize: '22px', fontWeight: 800, marginBottom: '8px' }}>Click Any Location</h3>
            <p style={{ color: '#365f45', fontSize: '14px', marginBottom: '24px' }}>Select a country/state/city or click directly on the globe to get satellite analysis</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {['🌾 NDVI Vegetation Index', '💧 Soil Moisture', '📡 SAR Analysis', '🌡️ Weather Data', '🗓️ Harvest Forecast', '📈 6-Month Trend'].map(tag => (
                <span key={tag} style={{ background: 'rgba(22,101,52,0.2)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '20px', padding: '6px 14px', color: '#4ade80', fontSize: '12px', fontWeight: 600 }}>{tag}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* AI GIRL ASSISTANT */}
      <AIGirl result={result} onAsk={() => {}} lang={currentLang} />
    </div>
  )
}
