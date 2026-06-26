import { useRef, useEffect, useState } from 'react'
import * as THREE from 'three'

interface Props {
  onLocationSelect: (lat: number, lon: number, countryName: string) => void
}

const COUNTRIES = [
  { name: 'India', lat: 20.5937, lon: 78.9629 },
  { name: 'China', lat: 35.8617, lon: 104.1954 },
  { name: 'USA', lat: 37.0902, lon: -95.7129 },
  { name: 'Brazil', lat: -14.2350, lon: -51.9253 },
  { name: 'Russia', lat: 61.5240, lon: 105.3188 },
  { name: 'Australia', lat: -25.2744, lon: 133.7751 },
  { name: 'Canada', lat: 56.1304, lon: -106.3468 },
  { name: 'UK', lat: 55.3781, lon: -3.4360 },
  { name: 'Germany', lat: 51.1657, lon: 10.4515 },
  { name: 'France', lat: 46.2276, lon: 2.2137 },
  { name: 'Japan', lat: 36.2048, lon: 138.2529 },
  { name: 'Pakistan', lat: 30.3753, lon: 69.3451 },
  { name: 'Nigeria', lat: 9.0820, lon: 8.6753 },
  { name: 'Egypt', lat: 26.8206, lon: 30.8025 },
  { name: 'Mexico', lat: 23.6345, lon: -102.5528 },
  { name: 'Indonesia', lat: -0.7893, lon: 113.9213 },
  { name: 'Argentina', lat: -38.4161, lon: -63.6167 },
  { name: 'South Africa', lat: -30.5595, lon: 22.9375 },
  { name: 'Saudi Arabia', lat: 23.8859, lon: 45.0792 },
  { name: 'Thailand', lat: 15.8700, lon: 100.9925 },
  { name: 'Kazakhstan', lat: 48.0196, lon: 66.9237 },
  { name: 'Iran', lat: 32.4279, lon: 53.6880 },
  { name: 'Turkey', lat: 38.9637, lon: 35.2433 },
  { name: 'Ukraine', lat: 48.3794, lon: 31.1656 },
  { name: 'Peru', lat: -9.1900, lon: -75.0152 },
]

function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = lon * (Math.PI / 180)
  return new THREE.Vector3(
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    -radius * Math.sin(phi) * Math.sin(theta)
  )
}

const geocodeCache: Record<string, string> = {}
async function reverseGeocode(lat: number, lon: number): Promise<string> {
  const key = `${lat.toFixed(1)},${lon.toFixed(1)}`
  if (geocodeCache[key]) return geocodeCache[key]
  try {
    const res = await fetch(
      `http://localhost:3001/api/satellite/reverse-geocode?lat=${lat}&lon=${lon}`,
      { headers: { 'Accept-Language': 'en' } }
    )
    const data = await res.json()
    const name = data.address?.country || 'Ocean'
    geocodeCache[key] = name
    return name
  } catch {
    return 'Unknown'
  }
}

export default function Globe3D({ onLocationSelect }: Props) {
  const mountRef = useRef<HTMLDivElement>(null)
  const [labels, setLabels] = useState<{ name: string; x: number; y: number; visible: boolean }[]>([])
  const [tooltip, setTooltip] = useState<{ x: number; y: number; name: string } | null>(null)
  const [clicking, setClicking] = useState(false)
  const earthRef = useRef<THREE.Mesh | null>(null)
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastHoverKeyRef = useRef<string>('')
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)

  useEffect(() => {
    const mount = mountRef.current!
    const width = mount.clientWidth
    const height = mount.clientHeight

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
    camera.position.z = 2.5
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    rendererRef.current = renderer
    mount.appendChild(renderer.domElement)

    // Earth
    const geometry = new THREE.SphereGeometry(1, 64, 64)
    const texture = new THREE.TextureLoader().load(
      'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg'
    )
    const material = new THREE.MeshPhongMaterial({ map: texture })
    const earth = new THREE.Mesh(geometry, material)
    earthRef.current = earth
    scene.add(earth)

    // Atmosphere
    scene.add(new THREE.Mesh(
      new THREE.SphereGeometry(1.02, 64, 64),
      new THREE.MeshPhongMaterial({ color: 0x4488ff, transparent: true, opacity: 0.07 })
    ))

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.6))
    const sun = new THREE.DirectionalLight(0xffffff, 1)
    sun.position.set(5, 3, 5)
    scene.add(sun)

    // Stars
    const starVerts: number[] = []
    for (let i = 0; i < 4000; i++) {
      starVerts.push((Math.random() - 0.5) * 300)
      starVerts.push((Math.random() - 0.5) * 300)
      starVerts.push((Math.random() - 0.5) * 300)
    }
    const starGeo = new THREE.BufferGeometry()
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starVerts, 3))
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.15 })))

    // Precompute label world positions
    const labelPositions = COUNTRIES.map(({ name, lat, lon }) => ({
      name,
      worldPos: latLonToVector3(lat, lon, 1.0)
    }))

    // Drag
    let isDragging = false
    let prevX = 0, prevY = 0
    let mouseDownX = 0, mouseDownY = 0

    mount.addEventListener('mousedown', (e) => {
      isDragging = true
      prevX = e.clientX; prevY = e.clientY
      mouseDownX = e.clientX; mouseDownY = e.clientY
    })
    mount.addEventListener('mouseup', () => { isDragging = false })
    mount.addEventListener('mousemove', (e) => {
      if (isDragging) {
        earth.rotation.y += (e.clientX - prevX) * 0.005
        earth.rotation.x += (e.clientY - prevY) * 0.005
        prevX = e.clientX; prevY = e.clientY
        return
      }

      // Hover tooltip
      const rect = mount.getBoundingClientRect()
      const mx = ((e.clientX - rect.left) / width) * 2 - 1
      const my = -((e.clientY - rect.top) / height) * 2 + 1
      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(new THREE.Vector2(mx, my), camera)
      const hits = raycaster.intersectObject(earth)
      if (hits.length > 0) {
        const localPoint = earth.worldToLocal(hits[0].point.clone()).normalize()
        const lat = Math.asin(Math.max(-1, Math.min(1, localPoint.y))) * (180 / Math.PI)
        const lon = Math.atan2(-localPoint.z, localPoint.x) * (180 / Math.PI)
        const adjustedLon = lon > 180 ? lon - 360 : lon < -180 ? lon + 360 : lon

        const screenX = e.clientX - rect.left
        const screenY = e.clientY - rect.top - 44
        const roundedKey = `${Math.round(lat)},${Math.round(adjustedLon)}`

        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)

        if (roundedKey === lastHoverKeyRef.current) {
          // Same spot as last lookup, just reposition tooltip without re-fetching
          setTooltip(prev => prev ? { ...prev, x: screenX, y: screenY } : prev)
        } else {
          hoverTimeoutRef.current = setTimeout(() => {
            lastHoverKeyRef.current = roundedKey
            reverseGeocode(lat, adjustedLon).then(name => {
              setTooltip({ x: screenX, y: screenY, name })
            })
          }, 600)
        }
      } else {
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
        lastHoverKeyRef.current = ''
        setTooltip(null)
      }
    })

    mount.addEventListener('mouseleave', () => setTooltip(null))

    mount.addEventListener('click', async (e) => {
      const dist = Math.hypot(e.clientX - mouseDownX, e.clientY - mouseDownY)
      if (dist > 5) return
      const rect = mount.getBoundingClientRect()
      const mx = ((e.clientX - rect.left) / width) * 2 - 1
      const my = -((e.clientY - rect.top) / height) * 2 + 1
      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(new THREE.Vector2(mx, my), camera)
      const hits = raycaster.intersectObject(earth)
      if (hits.length > 0) {
        setClicking(true)

        // Get hit point in world space
        const hitWorld = hits[0].point.clone()

        // Convert to local space of earth (accounts for all rotation)
        const localPoint = earth.worldToLocal(hitWorld.clone()).normalize()

        // Convert local 3D point to lat/lon
        const lat = Math.asin(Math.max(-1, Math.min(1, localPoint.y))) * (180 / Math.PI)
        const lon = Math.atan2(-localPoint.z, localPoint.x) * (180 / Math.PI)

        // Adjust for Three.js coordinate system vs geographic
        const adjustedLon = lon > 180 ? lon - 360 : lon < -180 ? lon + 360 : lon

        const country = await reverseGeocode(lat, adjustedLon)
        setTimeout(() => {
          onLocationSelect(lat, adjustedLon, country)
          setClicking(false)
        }, 400)
      }
    })

    // Animation — update HTML label positions every frame
    let animId: number
    const animate = () => {
      animId = requestAnimationFrame(animate)
      if (!isDragging) earth.rotation.y += 0.001
      renderer.render(scene, camera)

      // Project each country position to screen + check if facing camera
      const updated = labelPositions.map(({ name, worldPos }) => {
        // Rotate the label's world position with the earth
        const rotated = worldPos.clone().applyEuler(earth.rotation)

        // Dot product with camera direction — positive = facing camera
        const camDir = new THREE.Vector3(0, 0, 1)
        const dot = rotated.clone().normalize().dot(camDir)
        const visible = dot > 0.25 // only show when clearly on front face

        // Project to screen
        const projected = rotated.clone().project(camera)
        const x = (projected.x * 0.5 + 0.5) * width
        const y = (-projected.y * 0.5 + 0.5) * height

        return { name, x, y, visible }
      })

      setLabels(updated)
    }
    animate()

    return () => {
      cancelAnimationFrame(animId)
      mount.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div ref={mountRef} style={{ width: '100%', height: '500px', cursor: 'grab', position: 'relative' }}>

      {/* Country labels rendered as HTML, only on visible face */}
      {labels.map((label) =>
        label.visible ? (
          <div
            key={label.name}
            style={{
              position: 'absolute',
              left: label.x,
              top: label.y,
              transform: 'translate(-50%, -50%)',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 700,
              fontFamily: 'Arial, sans-serif',
              textShadow: '0 0 4px #000, 0 0 8px #000, 1px 1px 2px #000',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              letterSpacing: '0.5px',
            }}
          >
            {label.name}
          </div>
        ) : null
      )}

      {/* Hover tooltip */}
      {tooltip && (
        <div style={{
          position: 'absolute', left: tooltip.x, top: tooltip.y,
          background: 'rgba(0,0,0,0.8)', color: '#4ade80',
          padding: '6px 14px', borderRadius: '8px', fontSize: '13px',
          fontWeight: 600, pointerEvents: 'none',
          border: '1px solid #166534', whiteSpace: 'nowrap'
        }}>
          📍 {tooltip.name}
        </div>
      )}

      {/* Click feedback */}
      {clicking && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          background: 'rgba(0,0,0,0.85)', color: '#4ade80',
          padding: '14px 28px', borderRadius: '12px',
          fontSize: '15px', fontWeight: 700,
          border: '1px solid #166534'
        }}>
          🛰️ Loading Map...
        </div>
      )}
    </div>
  )
}
