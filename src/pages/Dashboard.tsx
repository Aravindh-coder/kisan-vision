import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useLang } from '../context/LanguageContext'
import LangSwitcher from '../components/LangSwitcher'

export default function Dashboard() {
  const { user, token, logout } = useAuth()
  const navigate = useNavigate()
  const { lang, setLang, t } = useLang()
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImage(file)
      setPreview(URL.createObjectURL(file))
      setResult(null)
      setError('')
    }
  }

  const handleAnalyze = async () => {
    if (!image) return
    setLoading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('image', image)
      const res = await axios.post('https://kisan-vision.onrender.com/api/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
      })
      setResult(res.data)
    } catch {
      setError('Analysis failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const severityColor = (s: string) => {
    if (s === 'Healthy') return '#4ade80'
    if (s === 'Mild') return '#fbbf24'
    if (s === 'Moderate') return '#f97316'
    return '#ef4444'
  }

  return (
    <div style={{ minHeight: '100vh', background: '#030a03', color: '#f0fdf4', fontFamily: 'system-ui, Arial, sans-serif', position: 'relative', overflowX: 'hidden' }}>

      {/* VIDEO BACKGROUND */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <iframe
          src="https://www.youtube.com/embed/BHACKCNDMW8?autoplay=1&mute=1&loop=1&playlist=BHACKCNDMW8&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1"
          allow="autoplay; encrypted-media"
          style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '177.78vh', height: '100vh', minWidth: '100vw', minHeight: '56.25vw', border: 'none', pointerEvents: 'none' }}
        />
      </div>

      {/* OVERLAYS */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 1, background: 'linear-gradient(to bottom, rgba(0,8,0,0.82), rgba(0,15,5,0.7), rgba(0,8,0,0.88))', pointerEvents: 'none' }} />

      {/* SCANLINE */}
      <div style={{
        position: 'fixed', left: 0, right: 0, height: '2px', zIndex: 2, pointerEvents: 'none',
        background: 'linear-gradient(90deg, transparent, rgba(74,222,128,0.6), transparent)',
        animation: 'scan 6s linear infinite'
      }} />
      <style>{`
        @keyframes scan { 0% { top: 0; opacity: 0.7; } 100% { top: 100%; opacity: 0; } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
        .card { background: rgba(2,10,2,0.85); border: 1px solid rgba(74,222,128,0.2); border-radius: 16px; backdrop-filter: blur(20px); animation: fadeUp 0.5s ease forwards; }
        .result-card { background: rgba(0,0,0,0.5); border: 1px solid rgba(74,222,128,0.15); border-radius: 12px; padding: 14px; }
        .nav-btn { border: none; border-radius: 10px; padding: 8px 16px; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
      `}</style>

      {/* CONTENT */}
      <div style={{ position: 'relative', zIndex: 3 }}>

        {/* NAVBAR */}
        <nav style={{ background: 'rgba(2,10,2,0.95)', borderBottom: '1px solid rgba(74,222,128,0.2)', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '60px', backdropFilter: 'blur(20px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(22,101,52,0.8)', border: '1px solid rgba(74,222,128,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🌾</div>
            <div>
              <div style={{ color: '#4ade80', fontSize: '16px', fontWeight: 800 }}>KISAN-VISION</div>
              <div style={{ color: '#365f45', fontSize: '10px' }}>AI Crop Intelligence</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* LIVE badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: '20px', padding: '5px 12px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', animation: 'blink 1.5s infinite', display: 'inline-block' }} />
              <span style={{ color: '#4ade80', fontSize: '11px', fontWeight: 700 }}>AI LIVE</span>
            </div>
            <span style={{ color: '#6b7280', fontSize: '13px' }}>👤 {user?.name}</span>
            <button className="nav-btn" onClick={() => navigate('/satellite')} style={{ background: 'rgba(37,99,235,0.3)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.3)' }}>{t.satellite}</button>
            <button className="nav-btn" onClick={() => navigate('/crop-detect')} style={{ background: 'rgba(22,163,74,0.8)', color: '#fff', border: 'none' }}>🌿 Crop Doctor</button>
            <button className="nav-btn" onClick={() => window.open('/land-map.html', '_blank')} style={{ background: 'rgba(22,101,52,0.3)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)' }}>{t.myLands}</button>
            <LangSwitcher />
            <button className="nav-btn" onClick={handleLogout} style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>{t.logout}</button>
          </div>
        </nav>

        {/* MAIN */}
        <div style={{ maxWidth: '860px', margin: '0 auto', padding: '40px 24px' }}>

          {/* HEADER */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(22,101,52,0.7)', border: '1px solid rgba(74,222,128,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🔬</div>
              <div>
                <h2 style={{ color: '#4ade80', fontSize: '26px', fontWeight: 800, margin: 0 }}>{t.cropDetection}</h2>
                <p style={{ color: '#365f45', fontSize: '13px', margin: 0 }}>AI-powered plant health analysis · Powered by LLaVA Vision Model</p>
              </div>
            </div>
          </div>

          {/* UPLOAD CARD */}
          <div className="card" style={{ padding: '32px', marginBottom: '24px', textAlign: 'center' }}>

            {/* Satellite + Agri visual strip */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', justifyContent: 'center' }}>
              {['🛰️ Sentinel-2', '🌿 NDVI', '🔬 AI Vision', '🦠 Disease ID', '💊 Treatment'].map(tag => (
                <span key={tag} style={{ background: 'rgba(22,101,52,0.3)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '20px', padding: '4px 10px', fontSize: '11px', color: '#4ade80', fontWeight: 600 }}>{tag}</span>
              ))}
            </div>

            {preview ? (
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: '20px' }}>
                <img src={preview} alt="preview" style={{ maxHeight: '280px', maxWidth: '100%', borderRadius: '14px', border: '2px solid rgba(74,222,128,0.3)', objectFit: 'contain' }} />
                <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: '8px', padding: '4px 10px', fontSize: '11px', color: '#4ade80', fontWeight: 700 }}>📡 READY TO SCAN</div>
              </div>
            ) : (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '64px', marginBottom: '12px' }}>🌱</div>
                <p style={{ color: '#365f45', fontSize: '14px', margin: 0 }}>Upload a crop photo for instant AI disease diagnosis</p>
              </div>
            )}

            <label style={{ cursor: 'pointer', background: 'rgba(22,101,52,0.4)', border: '1px solid rgba(74,222,128,0.3)', color: '#4ade80', padding: '12px 24px', borderRadius: '10px', fontWeight: 700, fontSize: '14px', display: 'inline-block', marginBottom: '16px', transition: 'all 0.2s' }}>
              {preview ? t.changeImage : '{t.chooseImage}'}
              <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
            </label>

            {image && (
              <div>
                <p style={{ color: '#6b7280', fontSize: '12px', marginBottom: '16px' }}>📁 {image.name}</p>
                <button
                  onClick={handleAnalyze}
                  disabled={loading}
                  style={{ background: loading ? 'rgba(75,85,99,0.5)' : '#16a34a', color: '#fff', border: 'none', borderRadius: '12px', padding: '14px 32px', fontSize: '16px', fontWeight: 800, cursor: loading ? 'wait' : 'pointer', transition: 'all 0.2s', boxShadow: loading ? 'none' : '0 4px 20px rgba(22,163,74,0.3)' }}
                >
                  {loading ? '{t.analyzing}' : '{t.analyzeCrop}'}
                </button>
              </div>
            )}
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '12px 16px', color: '#f87171', marginBottom: '16px', fontSize: '14px' }}>
              ⚠️ {error}
            </div>
          )}

          {/* RESULTS */}
          {result && (
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ color: '#4ade80', fontSize: '18px', fontWeight: 800, margin: 0 }}>🔬 Analysis Result</h3>
                <span style={{ color: severityColor(result.severity), fontWeight: 800, fontSize: '16px', background: 'rgba(0,0,0,0.4)', border: `1px solid ${severityColor(result.severity)}40`, borderRadius: '20px', padding: '4px 16px' }}>
                  {result.severity}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div className="result-card">
                  <p style={{ color: '#365f45', fontSize: '11px', margin: '0 0 4px', fontWeight: 700, letterSpacing: '0.06em' }}>{t.cropType}</p>
                  <p style={{ color: '#f0fdf4', fontWeight: 700, margin: 0, fontSize: '15px' }}>{result.crop || 'Unknown'}</p>
                </div>
                <div className="result-card">
                  <p style={{ color: '#365f45', fontSize: '11px', margin: '0 0 4px', fontWeight: 700, letterSpacing: '0.06em' }}>{t.disease}</p>
                  <p style={{ color: '#f0fdf4', fontWeight: 700, margin: 0, fontSize: '15px' }}>{result.disease || 'None detected'}</p>
                </div>
              </div>

              {result.symptoms?.length > 0 && (
                <div className="result-card" style={{ marginBottom: '12px' }}>
                  <p style={{ color: '#365f45', fontSize: '11px', margin: '0 0 10px', fontWeight: 700, letterSpacing: '0.06em' }}>{t.symptoms}</p>
                  {result.symptoms.map((s: string, i: number) => (
                    <p key={i} style={{ color: '#fbbf24', fontSize: '13px', margin: '4px 0' }}>• {s}</p>
                  ))}
                </div>
              )}

              {result.treatment?.length > 0 && (
                <div className="result-card" style={{ marginBottom: '12px' }}>
                  <p style={{ color: '#365f45', fontSize: '11px', margin: '0 0 10px', fontWeight: 700, letterSpacing: '0.06em' }}>{t.treatment}</p>
                  {result.treatment.map((t: string, i: number) => (
                    <p key={i} style={{ color: '#4ade80', fontSize: '13px', margin: '4px 0' }}>✓ {t}</p>
                  ))}
                </div>
              )}

              {result.prevention?.length > 0 && (
                <div className="result-card">
                  <p style={{ color: '#365f45', fontSize: '11px', margin: '0 0 10px', fontWeight: 700, letterSpacing: '0.06em' }}>{t.prevention}</p>
                  {result.prevention.map((p: string, i: number) => (
                    <p key={i} style={{ color: '#93c5fd', fontSize: '13px', margin: '4px 0' }}>→ {p}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
