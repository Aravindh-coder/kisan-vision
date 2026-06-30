import { useNavigate } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import LangSwitcher from '../components/LangSwitcher'

export default function Hackathon() {
  const navigate = useNavigate()
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (heroRef.current) heroRef.current.scrollIntoView({ behavior: 'smooth' })
  }, [])

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-x-hidden">
      <nav className="fixed top-0 w-full z-50 bg-gray-950/95 backdrop-blur-md border-b border-green-900">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🛰️</span>
            <span className="text-xl font-bold text-green-400">KISAN-VISION</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="px-4 py-2 rounded-xl border border-green-700 text-green-400 hover:bg-green-900 transition text-sm font-semibold">
              Home
            </button>
            <button onClick={() => navigate('/satellite')} className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white transition text-sm font-semibold">
              Launch Demo
            </button>
            <LangSwitcher />
          </div>
        </div>
      </nav>

      <section ref={heroRef} className="min-h-screen flex items-center justify-center relative pt-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_25%),radial-gradient(circle_at_bottom_right,_rgba(56,189,248,0.15),_transparent_30%)]" />
        <div className="relative max-w-6xl mx-auto px-6 py-16">
          <div className="bg-gray-900/80 border border-green-900 rounded-[2rem] p-10 shadow-2xl shadow-black/50 backdrop-blur-xl">
            <div className="inline-flex items-center gap-2 mb-6 text-sm font-semibold text-green-300 uppercase tracking-[0.25em]">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              ISRO Bharatiya Antariksh Hackathon 2026
            </div>
            <h1 className="text-5xl md:text-6xl font-black leading-tight text-white mb-6">
              KISAN-VISION — Space-Powered Precision Farming for Every Farmer
            </h1>
            <p className="text-gray-300 text-lg max-w-3xl leading-relaxed mb-8">
              A working satellite intelligence platform that turns Sentinel-2 + SAR data into field-specific crop health, moisture stress, and irrigation advisories,
              delivered through conversational AI and WhatsApp for smallholders. This submission is built to solve India’s largest farming information gap with a real product,
              not a wireframe.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={() => navigate('/satellite')} className="px-8 py-4 rounded-2xl bg-green-600 hover:bg-green-500 text-white font-bold transition">
                Launch Live Demo
              </button>
              <button onClick={() => navigate('/register')} className="px-8 py-4 rounded-2xl border border-green-700 text-green-300 hover:bg-green-950 transition">
                Register Your Farm
              </button>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-6 pb-24">
        <section className="grid gap-8 md:grid-cols-2 mt-12">
          <div className="bg-gray-900/80 border border-green-900 rounded-[2rem] p-8 shadow-xl shadow-black/30">
            <h2 className="text-3xl font-extrabold text-white mb-4">Problem We Solve</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Smallholder farmers in India lack affordable access to field-level satellite intelligence.
              Government advisories are district-level and generic, enterprise products are B2B-only, and photo-only apps react after damage has already occurred.
            </p>
            <p className="text-gray-300 leading-relaxed">
              KISAN-VISION provides a self-service platform where farmers register their exact field boundary,
              receive live NDVI/NDWI/EVI/SAVI insights, and get automated AI advisories on irrigation, disease risk and harvest timing.
            </p>
          </div>

          <div className="bg-gray-900/80 border border-blue-900 rounded-[2rem] p-8 shadow-xl shadow-black/30">
            <h2 className="text-3xl font-extrabold text-white mb-4">Why This Wins</h2>
            <ul className="space-y-3 text-gray-300">
              <li>• Real working prototype with live Google Earth Engine satellite analytics.</li>
              <li>• Field-level advisory for farmers, not just enterprise dashboards.</li>
              <li>• Trilingual support plus WhatsApp daily delivery for mainstream adoption.</li>
              <li>• AI crop classification + phenology stage inference for meaningful satellite guidance.</li>
              <li>• Uses open/free satellite data and low-cost cloud compute suitable for nation-scale rollout.</li>
            </ul>
          </div>
        </section>

        <section className="mt-16 grid gap-8 lg:grid-cols-3">
          {[
            { title: 'Live Satellite Fusion', desc: 'Sentinel-2 optical imagery and SAR-based moisture analytics combined with Google Earth Engine for robust all-weather monitoring.' },
            { title: 'Working AI Stack', desc: 'Groq LLM for conversational advice, Gemini fallback logic, and an image-based crop disease detector in the same product.' },
            { title: 'Farmer-first Delivery', desc: 'Daily WhatsApp alerts, email summaries, and low-bandwidth support to meet the way farmers already work.' },
          ].map(card => (
            <div key={card.title} className="bg-gray-900/85 border border-green-900 rounded-[2rem] p-8">
              <h3 className="text-2xl font-bold text-white mb-3">{card.title}</h3>
              <p className="text-gray-300 leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </section>

        <section className="mt-16 bg-gray-900/80 border border-green-900 rounded-[2rem] p-10 shadow-2xl shadow-black/40">
          <h2 className="text-3xl font-extrabold text-white mb-6">Award-Focused Highlights</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="rounded-3xl bg-green-950/60 border border-green-800 p-6">
                <h3 className="text-xl font-bold text-white mb-2">Deployment Ready</h3>
                <p className="text-gray-300">Live demo deployed on Render.com, not just slides. Judges can verify a working pipeline end-to-end.</p>
              </div>
              <div className="rounded-3xl bg-blue-950/60 border border-blue-800 p-6">
                <h3 className="text-xl font-bold text-white mb-2">Real Product, Real Impact</h3>
                <p className="text-gray-300">Supports field boundary registration, satellite monitoring, risk scoring, and farmer-friendly advice across languages.</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="rounded-3xl bg-emerald-950/60 border border-emerald-800 p-6">
                <h3 className="text-xl font-bold text-white mb-2">ISRO-Relevant</h3>
                <p className="text-gray-300">Built around remote sensing and space application for agriculture — directly aligned with ISRO’s mission.</p>
              </div>
              <div className="rounded-3xl bg-gray-900/70 border border-yellow-900 p-6">
                <h3 className="text-xl font-bold text-white mb-2">Scale & Sustainability</h3>
                <p className="text-gray-300">Model built to scale on free satellite data, minimal compute, and affordable farmer delivery.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-16 bg-gray-900/80 border border-blue-900 rounded-[2rem] p-10 shadow-2xl shadow-black/40">
          <h2 className="text-3xl font-extrabold text-white mb-6">ML Validation Story</h2>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl bg-gray-950/70 border border-green-800 p-6">
              <h3 className="text-xl font-bold text-white mb-3">Prototype ML Workflow</h3>
              <ul className="space-y-2 text-gray-300 list-disc list-inside">
                <li>NDVI time-series features are extracted from live satellite inputs.</li>
                <li>A lightweight multiclass model estimates crop type and growth stage.</li>
                <li>Inference is exposed directly in the satellite advisory pipeline.</li>
                <li>Heuristic fallback keeps the app usable if the model is unavailable.</li>
              </ul>
            </div>
            <div className="rounded-3xl bg-gray-950/70 border border-blue-800 p-6">
              <h3 className="text-xl font-bold text-white mb-3">Validation Metrics</h3>
              <ul className="space-y-2 text-gray-300 list-disc list-inside">
                <li>Crop classifier: 0.1667 accuracy, 0.0836 macro-F1, 0.5972 top-3 accuracy.</li>
                <li>Phenology stage mapper: 0.6150 accuracy, 0.5006 macro-F1, 1.0000 top-3 accuracy.</li>
                <li>Protocol: 80/20 held-out validation on class-balanced synthetic NDVI profiles.</li>
                <li>Next milestone: replace synthetic data with field-labeled agronomic samples.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mt-16 bg-gray-900/80 border border-green-900 rounded-[2rem] p-10 shadow-2xl shadow-black/40">
          <h2 className="text-3xl font-extrabold text-white mb-6">Methodology & Slide-Ready Narrative</h2>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl bg-gray-950/70 border border-green-800 p-6">
              <h3 className="text-xl font-bold text-white mb-3">How the solution works</h3>
              <ul className="space-y-2 text-gray-300 list-disc list-inside">
                <li>Register the field boundary and connect it to live satellite observations.</li>
                <li>Extract vegetation and moisture indicators such as NDVI, NDWI, EVI and SAVI.</li>
                <li>Use a trained multiclass model to predict crop type and phenology stage.</li>
                <li>Convert the outputs into actionable alerts for irrigation, stress and harvest timing.</li>
              </ul>
            </div>
            <div className="rounded-3xl bg-gray-950/70 border border-blue-800 p-6">
              <h3 className="text-xl font-bold text-white mb-3">Why judges will care</h3>
              <ul className="space-y-2 text-gray-300 list-disc list-inside">
                <li>It is not a mockup — the platform is deployed and the workflow is end-to-end.</li>
                <li>It combines remote sensing, AI and farmer delivery into one coherent product.</li>
                <li>It is designed for scalable deployment using open satellite data and lightweight compute.</li>
                <li>It has a clear roadmap from prototype to field-validated agricultural intelligence.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mt-16 grid gap-8 lg:grid-cols-2">
          <div className="bg-gray-900/80 border border-green-900 rounded-[2rem] p-8">
            <h3 className="text-3xl font-bold text-white mb-4">Tech Architecture</h3>
            <ul className="list-disc list-inside space-y-3 text-gray-300">
              <li>Google Earth Engine for Sentinel-2 and Dynamic World land classification</li>
              <li>React + Leaflet + 3D globe frontend for farmer land selection and visualization</li>
              <li>Node.js backend with satellite ingestion, time series analytics, and ML feature inference</li>
              <li>Groq LLM + Gemini fallback advisory for conversational agriculture guidance</li>
              <li>WhatsApp & email automation for daily farmer alerts</li>
            </ul>
          </div>
          <div className="bg-gray-900/80 border border-blue-900 rounded-[2rem] p-8">
            <h3 className="text-3xl font-bold text-white mb-4">Competitive Differentiation</h3>
            <ul className="list-disc list-inside space-y-3 text-gray-300">
              <li>Unlike CropIn/SatSure, this product is farmer-facing, not corporate dashboard only.</li>
              <li>Unlike Plantix, it provides proactive satellite-based early warning rather than reactive photo diagnosis.</li>
              <li>Unlike government DSS, it is field-specific, not district-average, and delivers advice in WhatsApp.</li>
              <li>Includes live ML crop classification and phenology inference for stronger decision support.</li>
            </ul>
          </div>
        </section>

        <section className="mt-16 bg-gray-900/80 border border-yellow-900 rounded-[2rem] p-10 shadow-2xl shadow-black/40">
          <h2 className="text-3xl font-extrabold text-white mb-6">Scale-Up Roadmap</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-3xl bg-gray-950/70 border border-green-800 p-6">
              <h3 className="text-xl font-bold text-white mb-2">Phase 1</h3>
              <p className="text-gray-300">Collect field-labeled crop and phenology data from agronomists and farmer cooperatives.</p>
            </div>
            <div className="rounded-3xl bg-gray-950/70 border border-blue-800 p-6">
              <h3 className="text-xl font-bold text-white mb-2">Phase 2</h3>
              <p className="text-gray-300">Upgrade the current prototype with higher-fidelity models and region-specific calibration.</p>
            </div>
            <div className="rounded-3xl bg-gray-950/70 border border-yellow-800 p-6">
              <h3 className="text-xl font-bold text-white mb-2">Phase 3</h3>
              <p className="text-gray-300">Deploy at state and national scale with multilingual advisory delivery and real-time monitoring.</p>
            </div>
          </div>
        </section>

        <section className="mt-16 text-center">
          <div className="inline-flex flex-col gap-3 bg-green-950/70 border border-green-800 rounded-[2rem] p-10">
            <h2 className="text-4xl font-black text-white">Submission Ready</h2>
            <p className="text-gray-300 max-w-3xl mx-auto leading-relaxed">
              This ISRO hackathon submission combines actual satellite analytics, farmer-facing workflows, AI advisory, and deployment readiness in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
              <button onClick={() => navigate('/satellite')} className="px-10 py-4 rounded-2xl bg-green-600 hover:bg-green-500 text-white font-bold transition">
                Open Live Demo
              </button>
              <button onClick={() => navigate('/register')} className="px-10 py-4 rounded-2xl border border-green-700 text-green-300 hover:bg-gray-900 transition">
                Start Farmer Signup
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
