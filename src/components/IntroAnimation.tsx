import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

interface Props {
  onComplete: () => void
  langText?: { team: string; presents: string; tagline: string; tags: string[] }
}

export default function IntroAnimation({ onComplete, langText }: Props) {
  const mountRef = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState(0)
  const [visible, setVisible] = useState(true)
  const t = langText || { team: 'TEAM', presents: 'PRESENTS', tagline: 'Satellite Intelligence for Modern Agriculture', tags: ['🛰️ Sentinel-2', '🌿 NDVI Analysis', '🤖 AI Advisory', '📱 WhatsApp Alerts'] }

  useEffect(() => {
    const mount = mountRef.current!
    const width = mount.clientWidth
    const height = mount.clientHeight

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
    camera.position.z = 3

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setSize(width, height)
    renderer.setClearColor(0x000000)
    mount.appendChild(renderer.domElement)

    // Earth
    const earthTex = new THREE.TextureLoader().load(
      'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg'
    )
    const earth = new THREE.Mesh(
      new THREE.SphereGeometry(1, 64, 64),
      new THREE.MeshPhongMaterial({ map: earthTex })
    )
    earth.position.x = 3
    earth.position.y = -3
    scene.add(earth)

    // Atmosphere
    scene.add(new THREE.Mesh(
      new THREE.SphereGeometry(1.05, 64, 64),
      new THREE.MeshPhongMaterial({ color: 0x4488ff, transparent: true, opacity: 0.1 })
    ))

    // Orbit rings
    const ring1 = new THREE.Mesh(
      new THREE.TorusGeometry(1.6, 0.004, 16, 100),
      new THREE.MeshBasicMaterial({ color: 0x4ade80, transparent: true, opacity: 0.5 })
    )
    ring1.rotation.x = Math.PI / 3
    ring1.position.x = 3
    ring1.position.y = -3
    scene.add(ring1)

    const ring2 = new THREE.Mesh(
      new THREE.TorusGeometry(2.0, 0.003, 16, 100),
      new THREE.MeshBasicMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.3 })
    )
    ring2.rotation.x = Math.PI / 4
    ring2.rotation.y = Math.PI / 5
    ring2.position.x = 3
    ring2.position.y = -3
    scene.add(ring2)

    // Satellite
    const satGroup = new THREE.Group()
    satGroup.add(new THREE.Mesh(
      new THREE.BoxGeometry(0.07, 0.025, 0.025),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    ))
    const panelMat = new THREE.MeshBasicMaterial({ color: 0x60a5fa })
    const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.003, 0.035), panelMat)
    p1.position.x = 0.08
    const p2 = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.003, 0.035), panelMat)
    p2.position.x = -0.08
    satGroup.add(p1, p2)
    scene.add(satGroup)

    // Stars
    const starVerts: number[] = []
    for (let i = 0; i < 5000; i++) {
      starVerts.push((Math.random() - 0.5) * 300)
      starVerts.push((Math.random() - 0.5) * 300)
      starVerts.push((Math.random() - 0.5) * 300)
    }
    const starGeo = new THREE.BufferGeometry()
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starVerts, 3))
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.15 })))

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.5))
    const sun = new THREE.DirectionalLight(0xffffff, 1.2)
    sun.position.set(5, 3, 5)
    scene.add(sun)
    const greenLight = new THREE.PointLight(0x4ade80, 0.8, 10)
    greenLight.position.set(-3, 2, 2)
    scene.add(greenLight)

    let t = 0
    let animId: number

    const animate = () => {
      animId = requestAnimationFrame(animate)
      t += 0.008

      earth.rotation.y += 0.003
      ring1.rotation.z += 0.002
      ring2.rotation.z -= 0.001

      // Earth zooms in
      const scale = Math.min(1, t * 0.15)
      earth.scale.setScalar(scale)
      ring1.scale.setScalar(scale)
      ring2.scale.setScalar(scale)

      // Earth moves to center
      earth.position.x = 3 * (1 - Math.min(1, t * 0.12))
      earth.position.y = -3 * (1 - Math.min(1, t * 0.12))
      ring1.position.copy(earth.position)
      ring2.position.copy(earth.position)

      // Satellite orbit
      satGroup.position.x = earth.position.x + Math.cos(t * 1.5) * 1.6
      satGroup.position.z = Math.sin(t * 1.5) * 1.6 * Math.cos(Math.PI / 3)
      satGroup.position.y = earth.position.y + Math.sin(t * 1.5) * 1.6 * Math.sin(Math.PI / 3)
      satGroup.rotation.y = -t

      renderer.render(scene, camera)
    }
    animate()

    // Phase timeline
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 2000),
      setTimeout(() => setPhase(3), 3800),
      setTimeout(() => setPhase(4), 5500),
      setTimeout(() => setPhase(5), 7200),
      setTimeout(() => {
        setVisible(false)
        setTimeout(onComplete, 800)
      }, 8500),
    ]

    return () => {
      cancelAnimationFrame(animId)
      timers.forEach(clearTimeout)
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
      style={{
        background: '#000',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.8s ease-out'
      }}
    >
      {/* Three.js canvas */}
      <div ref={mountRef} className="absolute inset-0" />

      {/* Scanline overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)'
      }} />

      {/* Text content */}
      <div className="relative z-10 text-center px-8 select-none">

        {/* Phase 1: TERRASENSE */}
        <div style={{
          opacity: phase >= 1 && phase < 4 ? 1 : 0,
          transform: phase >= 1 && phase < 4 ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.95)',
          transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
          position: phase >= 4 ? 'absolute' : 'relative'
        }}>
          {phase < 3 && (
            <>
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="h-px w-16 bg-green-400 opacity-60" />
                <span className="text-green-400 text-sm font-mono tracking-widest uppercase">{t.team}</span>
                <div className="h-px w-16 bg-green-400 opacity-60" />
              </div>
              <h1
                className="font-black tracking-tight leading-none"
                style={{
                  fontSize: 'clamp(60px, 12vw, 140px)',
                  background: 'linear-gradient(135deg, #ffffff 0%, #4ade80 50%, #ffffff 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: 'none',
                  filter: 'drop-shadow(0 0 40px rgba(74,222,128,0.4))'
                }}
              >
                TERRA
                <span style={{
                  background: 'linear-gradient(135deg, #4ade80 0%, #60a5fa 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>SENSE</span>
              </h1>
              <p
                className="text-gray-400 font-mono tracking-[0.4em] uppercase text-sm mt-4"
                style={{
                  opacity: phase >= 2 ? 1 : 0,
                  transform: phase >= 2 ? 'translateY(0)' : 'translateY(10px)',
                  transition: 'all 0.6s ease 0.2s'
                }}
              >
                {t.presents}
              </p>
            </>
          )}
        </div>

        {/* Phase 2: KISAN-VISION */}
        <div style={{
          opacity: phase >= 3 ? 1 : 0,
          transform: phase >= 3 ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.9)',
          transition: 'all 1s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          {phase >= 3 && (
            <>
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="h-px flex-1 max-w-32" style={{ background: 'linear-gradient(90deg, transparent, #4ade80)' }} />
                <span className="text-green-400 text-xs font-mono tracking-widest">SATELLITE INTELLIGENCE</span>
                <div className="h-px flex-1 max-w-32" style={{ background: 'linear-gradient(90deg, #4ade80, transparent)' }} />
              </div>

              <h1
                className="font-black tracking-tight leading-none mb-4"
                style={{
                  fontSize: 'clamp(50px, 10vw, 120px)',
                  background: 'linear-gradient(135deg, #4ade80 0%, #ffffff 40%, #60a5fa 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 0 60px rgba(74,222,128,0.5))'
                }}
              >
                KISAN-VISION
              </h1>

              <p
                className="text-gray-300 text-xl font-light tracking-wide max-w-lg mx-auto"
                style={{
                  opacity: phase >= 4 ? 1 : 0,
                  transform: phase >= 4 ? 'translateY(0)' : 'translateY(15px)',
                  transition: 'all 0.7s ease 0.3s'
                }}
              >
                {t.tagline}
              </p>

              <div
                className="flex items-center justify-center gap-6 mt-8"
                style={{
                  opacity: phase >= 5 ? 1 : 0,
                  transform: phase >= 5 ? 'translateY(0)' : 'translateY(15px)',
                  transition: 'all 0.7s ease'
                }}
              >
                {t.tags.map(tag => (
                  <span key={tag} className="text-green-400 text-xs font-mono bg-green-900/30 border border-green-800 px-3 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Loading bar */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-48">
          <div className="h-px bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-400 rounded-full transition-all"
              style={{
                width: `${Math.min(100, (phase / 5) * 100)}%`,
                transition: 'width 1.5s ease',
                boxShadow: '0 0 8px #4ade80'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
