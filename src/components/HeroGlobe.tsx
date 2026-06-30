import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function HeroGlobe() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current!
    const width = mount.clientWidth
    const height = mount.clientHeight

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
    camera.position.z = 2.8

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(window.devicePixelRatio)
    mount.appendChild(renderer.domElement)

    // Earth
    const earthGeo = new THREE.SphereGeometry(1, 64, 64)
    const earthTex = new THREE.TextureLoader().load(
      'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg'
    )
    const earthMat = new THREE.MeshPhongMaterial({ map: earthTex })
    const earth = new THREE.Mesh(earthGeo, earthMat)
    scene.add(earth)

    // Atmosphere glow
    const atmosGeo = new THREE.SphereGeometry(1.05, 64, 64)
    const atmosMat = new THREE.MeshPhongMaterial({
      color: 0x4488ff,
      transparent: true,
      opacity: 0.12,
      side: THREE.FrontSide
    })
    scene.add(new THREE.Mesh(atmosGeo, atmosMat))

    // Outer glow ring
    const glowGeo = new THREE.SphereGeometry(1.15, 64, 64)
    const glowMat = new THREE.MeshPhongMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.04,
      side: THREE.FrontSide
    })
    scene.add(new THREE.Mesh(glowGeo, glowMat))

    // Orbit ring
    const ringGeo = new THREE.TorusGeometry(1.6, 0.005, 16, 100)
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x4ade80, transparent: true, opacity: 0.4 })
    const ring = new THREE.Mesh(ringGeo, ringMat)
    ring.rotation.x = Math.PI / 3
    scene.add(ring)

    // Second orbit ring
    const ring2 = new THREE.Mesh(
      new THREE.TorusGeometry(1.9, 0.003, 16, 100),
      new THREE.MeshBasicMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.3 })
    )
    ring2.rotation.x = Math.PI / 4
    ring2.rotation.y = Math.PI / 6
    scene.add(ring2)

    // Satellite on orbit
    const satGeo = new THREE.BoxGeometry(0.06, 0.02, 0.02)
    const satMat = new THREE.MeshBasicMaterial({ color: 0xffffff })
    const satellite = new THREE.Mesh(satGeo, satMat)
    scene.add(satellite)

    // Solar panels
    const panelGeo = new THREE.BoxGeometry(0.08, 0.002, 0.03)
    const panelMat = new THREE.MeshBasicMaterial({ color: 0x60a5fa })
    const panel1 = new THREE.Mesh(panelGeo, panelMat)
    panel1.position.x = 0.07
    const panel2 = new THREE.Mesh(panelGeo, panelMat)
    panel2.position.x = -0.07
    satellite.add(panel1)
    satellite.add(panel2)

    // Satellite 2
    const sat2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.015, 0.015),
      new THREE.MeshBasicMaterial({ color: 0xfbbf24 })
    )
    scene.add(sat2)

    // Stars
    const starVerts: number[] = []
    for (let i = 0; i < 3000; i++) {
      starVerts.push((Math.random() - 0.5) * 200)
      starVerts.push((Math.random() - 0.5) * 200)
      starVerts.push((Math.random() - 0.5) * 200)
    }
    const starGeo = new THREE.BufferGeometry()
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starVerts, 3))
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.12 })))

    // Scan line effect (green horizontal line)
    const scanGeo = new THREE.TorusGeometry(1.02, 0.002, 2, 100)
    const scanMat = new THREE.MeshBasicMaterial({ color: 0x4ade80, transparent: true, opacity: 0.8 })
    const scanLine = new THREE.Mesh(scanGeo, scanMat)
    scene.add(scanLine)

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.5))
    const sun = new THREE.DirectionalLight(0xffffff, 1.2)
    sun.position.set(5, 3, 5)
    scene.add(sun)
    const greenLight = new THREE.PointLight(0x4ade80, 0.5, 10)
    greenLight.position.set(-3, 2, 2)
    scene.add(greenLight)

    // Animation
    let animId: number
    let t = 0

    const animate = () => {
      animId = requestAnimationFrame(animate)
      t += 0.005

      // Earth rotation
      earth.rotation.y += 0.002

      // Satellite orbit
      satellite.position.x = Math.cos(t) * 1.6
      satellite.position.z = Math.sin(t) * 1.6 * Math.cos(Math.PI / 3)
      satellite.position.y = Math.sin(t) * 1.6 * Math.sin(Math.PI / 3)
      satellite.rotation.y = -t

      // Satellite 2 orbit (opposite direction)
      sat2.position.x = Math.cos(-t * 0.7 + Math.PI) * 1.9 * Math.cos(Math.PI / 6)
      sat2.position.z = Math.sin(-t * 0.7 + Math.PI) * 1.9
      sat2.position.y = Math.cos(-t * 0.7 + Math.PI) * 1.9 * Math.sin(Math.PI / 6)

      // Scan line
      scanLine.rotation.x = t * 0.5
      scanMat.opacity = 0.3 + Math.sin(t * 3) * 0.3

      // Gentle camera bob
      camera.position.y = Math.sin(t * 0.3) * 0.1

      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(animId)
      mount.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
}
