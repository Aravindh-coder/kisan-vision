import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { useLang } from '../context/LanguageContext'
import LangSwitcher from '../components/LangSwitcher'

function AnimatedBG() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    let animId: number
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    window.addEventListener('resize', resize)
    const particles: { x: number; y: number; vx: number; vy: number; life: number }[] = []
    for (let i = 0; i < 40; i++) particles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3, life: Math.random() })
    let t = 0
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      t += 0.005
      ctx.strokeStyle = 'rgba(74,222,128,0.06)'
      ctx.lineWidth = 1
      const gs = 60
      for (let x = 0; x < canvas.width; x += gs) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke() }
      for (let y = 0; y < canvas.height; y += gs) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke() }
      const scanY = (Math.sin(t) * 0.5 + 0.5) * canvas.height
      const grad = ctx.createLinearGradient(0, scanY - 60, 0, scanY + 60)
      grad.addColorStop(0, 'transparent')
      grad.addColorStop(0.5, 'rgba(74,222,128,0.08)')
      grad.addColorStop(1, 'transparent')
      ctx.fillStyle = grad
      ctx.fillRect(0, scanY - 60, canvas.width, 120)
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.life += 0.003
        if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0
        const alpha = Math.abs(Math.sin(p.life)) * 0.5
        ctx.beginPath(); ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(74,222,128,${alpha})`; ctx.fill()
      })
      const cg = ctx.createRadialGradient(0, canvas.height, 0, 0, canvas.height, 400)
      cg.addColorStop(0, 'rgba(22,163,74,0.08)'); cg.addColorStop(1, 'transparent')
      ctx.fillStyle = cg; ctx.fillRect(0, 0, canvas.width, canvas.height)
      animId = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()
  const { t } = useLang()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await axios.post('https://kisan-vision.onrender.com/api/auth/login', { email, password })
      login(res.data.token, res.data.user)
      navigate('/satellite')
    } catch {
      setError(t.invalidLogin)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#030a03', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, Arial, sans-serif', position: 'relative' }}>
      <AnimatedBG />
      <div style={{ position: 'fixed', top: '16px', right: '16px', zIndex: 100 }}>
        <LangSwitcher />
      </div>
      <div style={{ position: 'relative', zIndex: 1, background: 'rgba(2,10,2,0.95)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: '20px', padding: '40px', width: '100%', maxWidth: '420px', backdropFilter: 'blur(20px)', boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 40px rgba(74,222,128,0.05)' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>🌾</div>
          <h1 style={{ color: '#4ade80', fontSize: '24px', fontWeight: 900, margin: '0 0 6px', letterSpacing: '0.05em' }}>KISAN-VISION</h1>
          <p style={{ color: '#365f45', fontSize: '14px', margin: 0 }}>{t.signIn}</p>
        </div>
        {error && <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '10px 14px', color: '#f87171', marginBottom: '16px', fontSize: '13px' }}>⚠️ {error}</div>}
        <form onSubmit={handleSubmit}>
          <input type="email" placeholder={t.emailPlaceholder} value={email} onChange={e => setEmail(e.target.value)}
            style={{ width: '100%', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '12px', padding: '14px 16px', color: '#f0fdf4', fontSize: '14px', outline: 'none', marginBottom: '12px', boxSizing: 'border-box' }} />
          <input type="password" placeholder={t.passwordPlaceholder} value={password} onChange={e => setPassword(e.target.value)}
            style={{ width: '100%', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '12px', padding: '14px 16px', color: '#f0fdf4', fontSize: '14px', outline: 'none', marginBottom: '20px', boxSizing: 'border-box' }} />
          <button type="submit" style={{ width: '100%', background: 'linear-gradient(135deg, #16a34a, #065f46)', color: '#fff', border: 'none', borderRadius: '12px', padding: '14px', fontSize: '15px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 20px rgba(22,163,74,0.3)' }}>
            {t.signIn}
          </button>
        </form>
        <p style={{ color: '#365f45', marginTop: '20px', textAlign: 'center', fontSize: '13px' }}>
          {t.noAccount} <Link to="/register" style={{ color: '#4ade80', textDecoration: 'none', fontWeight: 700 }}>{t.registerLink}</Link>
        </p>
      </div>
    </div>
  )
}
