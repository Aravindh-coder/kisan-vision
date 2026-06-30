import { useNavigate } from 'react-router-dom'
import HeroGlobe from '../components/HeroGlobe'
import IntroAnimation from '../components/IntroAnimation'
import { useState } from 'react'
import { useEffect, useRef } from 'react'
import { useLang } from '../context/LanguageContext'

export default function Landing() {
  const navigate = useNavigate()
  const featuresRef = useRef<HTMLDivElement>(null)
  const [showIntro, setShowIntro] = useState(true)
  const { lang, setLang, t } = useLang()

  useEffect(() => {
    // Animate elements on scroll
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('opacity-100', 'translate-y-0')
      }),
      { threshold: 0.1 }
    )
    document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const features = [
    { icon: '🛰️', title: 'Live Satellite Data', desc: 'Real-time NDVI, NDWI & EVI from Sentinel-2 satellite imagery via Google Earth Engine' },
    { icon: '🌍', title: '3D Globe Explorer', desc: 'Interactive 3D globe with country detection — click anywhere to analyze crop health' },
    { icon: '🤖', title: 'AI Crop Assistant', desc: 'Ask Kisan-AI anything about your crops, irrigation, and field health in natural language' },
    { icon: '🔬', title: 'Disease Detection', desc: 'Upload crop photos for instant AI-powered disease identification and treatment advice' },
    { icon: '📱', title: 'WhatsApp Alerts', desc: 'Daily weather and crop health reports delivered to farmers via WhatsApp and Email' },
    { icon: '📈', title: '6-Month Trends', desc: 'Track NDVI vegetation health trends over 6 months with interactive charts' },
    { icon: '💧', title: 'Smart Irrigation', desc: 'AI-powered irrigation advisory based on real satellite moisture and weather data' },
    { icon: '🌾', title: 'Crop Calendar', desc: 'Season-aware crop type estimation using Dynamic World land classification' },
  ]

  const stats = [
    { value: '10m', label: 'Satellite Resolution' },
    { value: '6mo', label: 'Historical Data' },
    { value: '195+', label: 'Countries Covered' },
    { value: '24/7', label: 'Live Monitoring' },
  ]

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-x-hidden">
      {showIntro && <IntroAnimation onComplete={() => setShowIntro(false)} />}

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-gray-950/80 backdrop-blur-md border-b border-green-900">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🛰️</span>
            <span className="text-xl font-bold text-green-400">KISAN-VISION</span>
          </div>
          <div className="flex gap-3 items-center">
            <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '10px', padding: '4px' }}>
              {(['en', 'hi', 'ta'] as const).map(l => (
                <button key={l} onClick={() => setLang(l)} style={{
                  padding: '4px 10px', borderRadius: '7px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', border: 'none',
                  background: lang === l ? '#16a34a' : 'transparent',
                  color: lang === l ? '#fff' : '#4ade80', transition: 'all 0.2s'
                }}>
                  {l === 'en' ? 'EN' : l === 'hi' ? 'हि' : 'த'}
                </button>
              ))}
            </div>
            <button
              onClick={() => navigate('/hackathon')}
              className="px-5 py-2 rounded-xl border border-blue-600 text-blue-300 hover:bg-blue-900 transition text-sm font-semibold"
            >
              Hackathon Pitch
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-5 py-2 rounded-xl border border-green-700 text-green-400 hover:bg-green-900 transition text-sm font-semibold"
            >
              {t.login}
            </button>
            <button
              onClick={() => navigate('/register')}
              className="px-5 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white transition text-sm font-semibold"
            >
              {t.getStarted}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* 3D Globe Background */}
        <div className="absolute inset-0 z-0">
          <HeroGlobe />
        </div>
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute w-96 h-96 bg-green-900/30 rounded-full blur-3xl -top-20 -left-20 animate-pulse" />
          <div className="absolute w-96 h-96 bg-emerald-900/20 rounded-full blur-3xl -bottom-20 -right-20 animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute w-64 h-64 bg-blue-900/20 rounded-full blur-3xl top-1/2 left-1/2 animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        {/* Grid pattern */}
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(74,222,128,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(74,222,128,0.03) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }} />

        <div className="relative text-center px-6 max-w-5xl mx-auto pt-20">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-green-900/50 border border-green-700 rounded-full px-4 py-2 mb-8 text-sm text-green-400">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Powered by Google Earth Engine + Sentinel-2
          </div>

          <h1 className="text-6xl md:text-7xl font-black mb-6 leading-tight">
            <span className="text-white">Smart Farming</span>
            <br />
            <span className="bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
              From Space
            </span>
          </h1>

          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            KISAN-VISION uses real satellite data to monitor crop health, detect diseases,
            and deliver AI-powered irrigation advisories directly to farmers.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button
              onClick={() => navigate('/register')}
              className="px-8 py-4 bg-green-600 hover:bg-green-500 rounded-2xl text-lg font-bold transition-all hover:scale-105 shadow-lg shadow-green-900"
            >
              🚀 Start Monitoring Free
            </button>
            <button
              onClick={() => featuresRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-4 bg-gray-800 hover:bg-gray-700 rounded-2xl text-lg font-bold transition-all hover:scale-105 border border-gray-700"
            >
              📖 See Features
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {stats.map(s => (
              <div key={s.label} className="bg-gray-900/80 border border-green-900 rounded-2xl p-4">
                <p className="text-3xl font-black text-green-400">{s.value}</p>
                <p className="text-gray-400 text-sm">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Quick project blurb to fill hero space */}
          <div className="max-w-3xl mx-auto bg-gray-900/60 border border-green-900/60 rounded-2xl p-6 md:p-8">
            <p className="text-gray-300 text-base md:text-lg leading-relaxed">
              Built for the <span className="text-green-400 font-semibold">ISRO Bharatiya Antariksh Hackathon 2026</span>,
              KISAN-VISION combines Sentinel-2 satellite imagery, Google Earth Engine, and AI vision models
              to bring space-grade crop intelligence to every farmer — for free, in their own language.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section ref={featuresRef} className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              Everything a Farmer Needs,{' '}
              <span className="text-green-400">From Orbit</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Built for ISRO Bharatiya Antariksh Hackathon 2026 — real satellite data, real AI, real impact
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 bg-gray-900 border border-green-900 rounded-2xl p-6 hover:border-green-600 hover:bg-gray-800 transition-colors group"
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-green-400 transition-colors">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section className="py-10 px-6">
        <div className="max-w-4xl mx-auto bg-gray-900/60 border border-green-900 rounded-3xl p-10 md:p-14">
          <h2 className="text-3xl md:text-4xl font-black mb-6 text-center">
            About <span className="text-green-400">KISAN-VISION</span>
          </h2>
          <p className="text-gray-300 text-lg leading-relaxed mb-4">
            KISAN-VISION is a satellite-powered crop intelligence platform built to give every farmer
            access to the same agricultural insight tools used by large commercial farms — for free.
            By combining Sentinel-2 satellite imagery, Google Earth Engine, and modern AI vision models,
            we turn raw orbital data into simple, actionable advice a farmer can act on the same day.
          </p>
          <p className="text-gray-300 text-lg leading-relaxed mb-4">
            Our platform tracks vegetation health (NDVI), water stress (NDWI), and crop vigor (EVI) over
            a rolling 6-month window, layering in live weather data and AI-based disease detection from
            simple crop photos. The result is a single dashboard where a farmer can check field health,
            get an irrigation recommendation, or upload a photo of a sick plant and receive a treatment
            plan — all in their own language, on WhatsApp or in the browser.
          </p>
          <p className="text-gray-300 text-lg leading-relaxed">
            Built for the ISRO Bharatiya Antariksh Hackathon 2026, KISAN-VISION's mission is simple:
            make space-grade agricultural intelligence accessible to every farmer, regardless of land
            size, literacy, or internet bandwidth.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 bg-gray-900/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-black text-center mb-16">
            How <span className="text-green-400">KISAN-VISION</span> Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', icon: '📍', title: 'Select Your Field', desc: 'Use the 3D globe or dropdown to select your farm location anywhere in the world' },
              { step: '02', icon: '🛰️', title: 'Satellite Analysis', desc: 'We fetch real-time Sentinel-2 data and compute NDVI, NDWI, EVI for your exact location' },
              { step: '03', icon: '📲', title: 'Get Smart Advice', desc: 'Receive AI-powered crop advisory, disease alerts, and daily reports on WhatsApp & Email' },
            ].map(s => (
              <div key={s.step} className="text-center">
                <div className="text-6xl font-black text-green-900 mb-2">{s.step}</div>
                <div className="text-4xl mb-4">{s.icon}</div>
                <h3 className="text-xl font-bold mb-3">{s.title}</h3>
                <p className="text-gray-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-gradient-to-br from-green-900/50 to-emerald-900/30 border border-green-700 rounded-3xl p-12">
            <h2 className="text-4xl font-black mb-4">
              Ready to Monitor Your Farm<br />
              <span className="text-green-400">From Space?</span>
            </h2>
            <p className="text-gray-400 mb-8">Join farmers using satellite intelligence to grow smarter</p>
            <button
              onClick={() => navigate('/register')}
              className="px-10 py-4 bg-green-600 hover:bg-green-500 rounded-2xl text-xl font-bold transition-all hover:scale-105 shadow-lg shadow-green-900"
            >
              🌾 Get Started Free
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-green-900 py-8 px-6 text-center text-gray-500 text-sm">
        <p>🛰️ KISAN-VISION — Built for Bharatiya Antariksh Hackathon 2026 by ISRO & Hack2skill</p>
        <p className="mt-2">Powered by Google Earth Engine • Sentinel-2 • OpenWeatherMap • Ollama AI</p>
      </footer>
    </div>
  )
}
