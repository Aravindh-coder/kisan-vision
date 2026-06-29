import { useRef, useState } from 'react'

export default function WeatherAlertPage() {
  const phoneRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const successRef = useRef<HTMLDivElement>(null)
  const sentPhoneRef = useRef<HTMLSpanElement>(null)
  const sentEmailRef = useRef<HTMLSpanElement>(null)
  const locationInputRef = useRef<HTMLInputElement>(null)

  const [lat, setLat] = useState<number>(13.0827)
  const [lon, setLon] = useState<number>(80.2707)
  const [locationName, setLocationName] = useState<string>('')
  const [locationQuery, setLocationQuery] = useState<string>('')
  const [locationSearching, setLocationSearching] = useState(false)
  const [locationConfirmed, setLocationConfirmed] = useState(false)

  const searchLocation = async () => {
    const q = locationInputRef.current?.value?.trim()
    if (!q) return
    setLocationSearching(true)
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`)
      const data = await res.json()
      if (data && data[0]) {
        setLat(parseFloat(data[0].lat))
        setLon(parseFloat(data[0].lon))
        setLocationName(data[0].display_name.split(',').slice(0,2).join(', '))
        setLocationQuery(q)
        setLocationConfirmed(true)
      } else {
        alert('Location not found. Try being more specific (e.g. "Warangal, Telangana")')
      }
    } catch {
      alert('Could not search location. Check internet connection.')
    }
    setLocationSearching(false)
  }

  const handleSend = async () => {
    const phone = phoneRef.current?.value || ''
    const email = emailRef.current?.value || ''
    if (!phone && !email) { alert('Enter phone or email!'); return }
    const btn = btnRef.current!
    btn.disabled = true
    btn.textContent = '📤 Sending...'
    btn.style.opacity = '0.7'
    try {
      const token = localStorage.getItem('token') || ''
      const res = await fetch('https://kisan-vision.onrender.com/api/alerts/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ phone, email, lat, lon, locationName })
      })
      const data = await res.json()
      if (data.success) {
        if (sentPhoneRef.current && phone) sentPhoneRef.current.textContent = `📱 ${phone}`
        if (sentEmailRef.current && email) sentEmailRef.current.textContent = `📧 ${email}`
        if (successRef.current) {
          successRef.current.style.display = 'flex'
        }
        btn.textContent = '✅ Send Another Report'
        btn.disabled = false
        btn.style.opacity = '1'
        btn.style.background = '#065f46'
      } else {
        alert(data.error || 'Failed to send')
        btn.textContent = '📲 Send Weather Report Now'
        btn.disabled = false
        btn.style.opacity = '1'
      }
    } catch {
      alert('Connection error. Please try again.')
      btn.textContent = '📲 Send Weather Report Now'
      btn.disabled = false
      btn.style.opacity = '1'
    }
  }

  return (
    <div style={{
      position: 'relative',
      minHeight: '100vh',
      overflow: 'hidden',
      fontFamily: 'system-ui, Arial, sans-serif'
    }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(20px) }
          to   { opacity:1; transform:translateY(0) }
        }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
        @keyframes scan {
          0%   { top:-2px; opacity:0.8 }
          100% { top:100%; opacity:0 }
        }
        .inp { width:100%; background:rgba(0,0,0,0.55); color:#f0fdf4; border:1px solid rgba(74,222,128,0.25); border-radius:10px; padding:13px 16px; font-size:16px; box-sizing:border-box; outline:none; transition:border 0.2s }
        .inp:focus { border-color:#4ade80; background:rgba(0,0,0,0.75) }
        .inp::placeholder { color:#4b5563 }
        .send-btn { width:100%; background:#16a34a; color:#fff; border:none; border-radius:12px; padding:16px; font-size:17px; font-weight:800; cursor:pointer; letter-spacing:0.02em; transition:all 0.2s }
        .send-btn:hover:not(:disabled) { background:#15803d; transform:translateY(-2px); box-shadow:0 6px 20px rgba(22,163,74,0.4) }
        .send-btn:disabled { cursor:wait }
      `}</style>

      {/* YouTube iframe as full background — nature farm video */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        pointerEvents: 'none', overflow: 'hidden'
      }}>
        <iframe
          src="https://www.youtube.com/embed/BHACKCNDMW8?autoplay=1&mute=1&loop=1&playlist=BHACKCNDMW8&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&enablejsapi=1&start=10"
          allow="autoplay; encrypted-media"
          style={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '177.78vh',
            height: '100vh',
            minWidth: '100vw',
            minHeight: '56.25vw',
            border: 'none',
            pointerEvents: 'none'
          }}
        />
      </div>

      {/* Dark natural overlay */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1,
        background: 'linear-gradient(to bottom, rgba(0,8,0,0.65) 0%, rgba(0,15,5,0.55) 50%, rgba(0,8,0,0.75) 100%)'
      }} />

      {/* Satellite scan line */}
      <div style={{
        position: 'fixed', left: 0, right: 0, height: '2px', zIndex: 2,
        background: 'linear-gradient(90deg, transparent, rgba(74,222,128,0.8), transparent)',
        animation: 'scan 5s linear infinite',
        boxShadow: '0 0 10px rgba(74,222,128,0.5)'
      }} />

      {/* Live badge */}
      <div style={{
        position: 'fixed', top: '20px', right: '20px', zIndex: 10,
        display: 'flex', alignItems: 'center', gap: '8px',
        background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(74,222,128,0.4)',
        borderRadius: '20px', padding: '7px 14px', backdropFilter: 'blur(10px)'
      }}>
        <span style={{
          width: '7px', height: '7px', borderRadius: '50%',
          background: '#4ade80', display: 'inline-block',
          animation: 'blink 1.5s ease infinite'
        }} />
        <span style={{ color: '#4ade80', fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em' }}>
          KISAN-VISION LIVE
        </span>
      </div>

      {/* Card */}
      <div style={{
        position: 'relative', zIndex: 3,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', padding: '24px'
      }}>
        <div style={{
          background: 'rgba(2,10,2,0.82)',
          border: '1px solid rgba(74,222,128,0.2)',
          borderRadius: '22px', padding: '34px',
          width: '100%', maxWidth: '430px',
          backdropFilter: 'blur(24px)',
          boxShadow: '0 25px 80px rgba(0,0,0,0.7)',
          animation: 'fadeUp 0.6s ease forwards'
        }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <div style={{
              width: '46px', height: '46px', borderRadius: '13px',
              background: 'rgba(22,101,52,0.7)', border: '1px solid rgba(74,222,128,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px'
            }}>🌾</div>
            <div>
              <h2 style={{ color: '#4ade80', margin: 0, fontSize: '20px', fontWeight: 800 }}>
                Weather Alert
              </h2>
              <p style={{ color: '#365f45', margin: 0, fontSize: '12px', letterSpacing: '0.05em' }}>
                KISAN-VISION · Daily Farm Reports
              </p>
            </div>
          </div>

          <div style={{
            height: '1px', margin: '18px 0',
            background: 'linear-gradient(90deg, transparent, rgba(74,222,128,0.3), transparent)'
          }} />

          {/* Location Search */}
          <div style={{ marginBottom: '18px' }}>
            <p style={{ color: '#4ade80', fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', margin: '0 0 8px' }}>
              📍 YOUR FARM LOCATION
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                ref={locationInputRef}
                className="inp"
                placeholder="Type your village, district or city..."
                style={{ flex: 1 }}
                onKeyDown={e => e.key === 'Enter' && searchLocation()}
              />
              <button
                onClick={searchLocation}
                disabled={locationSearching}
                style={{
                  background: 'rgba(22,101,52,0.7)', color: '#4ade80',
                  border: '1px solid rgba(74,222,128,0.35)', borderRadius: '10px',
                  padding: '0 16px', fontSize: '18px', cursor: 'pointer',
                  whiteSpace: 'nowrap', opacity: locationSearching ? 0.6 : 1
                }}
              >{locationSearching ? '⏳' : '🔍'}</button>
            </div>

            {locationConfirmed && (
              <>
                {/* Map preview */}
                <div style={{
                  marginTop: '12px', borderRadius: '12px', overflow: 'hidden',
                  border: '1px solid rgba(74,222,128,0.25)', height: '180px'
                }}>
                  <iframe
                    key={`${lat},${lon}`}
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${lon-0.05},${lat-0.05},${lon+0.05},${lat+0.05}&layer=mapnik&marker=${lat},${lon}`}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                  />
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: 'rgba(22,101,52,0.2)', border: '1px solid rgba(74,222,128,0.15)',
                  borderRadius: '10px', padding: '10px 14px', marginTop: '10px'
                }}>
                  <span style={{ fontSize: '16px' }}>✅</span>
                  <div>
                    <p style={{ color: '#4ade80', margin: 0, fontWeight: 700, fontSize: '13px' }}>{locationName}</p>
                    <p style={{ color: '#374151', margin: '2px 0 0', fontSize: '11px' }}>{lat.toFixed(4)}° N · {lon.toFixed(4)}° E</p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Success — shown via DOM, zero React state */}
          <div ref={successRef} style={{
            display: 'none',
            flexDirection: 'column', alignItems: 'center',
            background: 'rgba(5,46,22,0.95)',
            border: '2px solid #4ade80',
            borderRadius: '16px', padding: '28px 20px',
            marginBottom: '22px', textAlign: 'center',
            boxShadow: '0 0 30px rgba(74,222,128,0.15)'
          }}>
            <div style={{ fontSize: '56px', lineHeight: 1, marginBottom: '12px' }}>✅</div>
            <p style={{ color: '#4ade80', fontWeight: 800, fontSize: '20px', margin: '0 0 6px' }}>
              Report Sent!
            </p>
            <p style={{ color: '#86efac', fontSize: '13px', margin: '0 0 14px' }}>
              Daily reports arrive at <strong style={{ color: '#4ade80' }}>6 AM</strong> every morning
            </p>
            <span ref={sentPhoneRef} style={{
              display: 'block', color: '#4ade80',
              fontWeight: 700, fontSize: '15px', marginBottom: '4px'
            }} />
            <span ref={sentEmailRef} style={{
              display: 'block', color: '#4ade80',
              fontWeight: 700, fontSize: '14px'
            }} />
            <p style={{
              color: '#166534', fontSize: '11px',
              marginTop: '14px', marginBottom: 0
            }}>
              Check your WhatsApp — first report sent now!
            </p>
          </div>

          {/* Phone */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{
              color: '#4b5563', fontSize: '11px', display: 'block',
              marginBottom: '7px', fontWeight: 700, letterSpacing: '0.08em'
            }}>
              📱 WHATSAPP NUMBER
            </label>
            <input
              ref={phoneRef}
              className="inp"
              defaultValue="+91"
              placeholder="+919876543210"
            />
          </div>

          {/* Email */}
          <div style={{ marginBottom: '22px' }}>
            <label style={{
              color: '#4b5563', fontSize: '11px', display: 'block',
              marginBottom: '7px', fontWeight: 700, letterSpacing: '0.08em'
            }}>
              📧 EMAIL <span style={{ color: '#1f2937', fontWeight: 400 }}>(optional)</span>
            </label>
            <input
              ref={emailRef}
              className="inp"
              placeholder="farmer@email.com"
            />
          </div>

          {/* Button */}
          <button ref={btnRef} onClick={handleSend} className="send-btn">
            📲 Send Weather Report Now
          </button>

          {/* Includes */}
          <div style={{
            marginTop: '20px', padding: '14px',
            background: 'rgba(0,0,0,0.4)', borderRadius: '10px',
            border: '1px solid #0f1f0f'
          }}>
            <p style={{
              color: '#1f2d1f', fontSize: '10px',
              margin: '0 0 8px', fontWeight: 700, letterSpacing: '0.08em'
            }}>
              DAILY REPORT INCLUDES
            </p>
            {[
              '🌡️  Temperature & humidity',
              '🌿  NDVI vegetation health',
              '💧  Irrigation advisory',
              '🌾  Crop & harvest estimate',
              '⚠️  Disease risk alert'
            ].map(item => (
              <p key={item} style={{ color: '#374151', fontSize: '12px', margin: '5px 0' }}>{item}</p>
            ))}
          </div>

          <p style={{
            color: '#1a2e1a', fontSize: '11px',
            textAlign: 'center', marginTop: '16px', marginBottom: 0
          }}>
            Free · Sentinel-2 Satellite · OpenWeatherMap
          </p>
        </div>
      </div>
    </div>
  )
}
