'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { LegacyJSONLoader } from '@/lib/LegacyJSONLoader'

gsap.registerPlugin(ScrollTrigger)

const PROXY = '/api/proxy?url='
const MODEL_URL = PROXY + encodeURIComponent('https://gobikcustom.com/3D/REPOSITORIOS/MODELOS/MAILLOT%20MC%20CX%20UNI%201457.js')
const TEXTURE_URL = PROXY + encodeURIComponent('https://gobikcustom.com/3D/GOBIK/DUBLIN%20RAVENS%20ROAD%20CLUB/BLANCO/250000455_MAILLOT%20MC%20CX%20UNI%201457_V1/escena/modelos/MAILLOT%20MC%20CX%20UNI%201457.jpg')
const NORMAL_URL = PROXY + encodeURIComponent('https://gobikcustom.com/3D/REPOSITORIOS/MAPAS/MAILLOT%20MC%20CX%20UNI%201457%20U_NORMALMAP.jpg')

export default function JerseyViewer() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mountRef.current) return
    const container = mountRef.current

    // Use container width for responsive sizing
    const getSize = () => ({
      width: container.clientWidth,
      height: Math.min(container.clientWidth, 600),
    })

    let { width, height } = getSize()

    // Scene setup
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100)
    camera.position.set(0, 0, 5)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.domElement.style.position = 'relative'
    renderer.domElement.style.zIndex = '0'
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = 'auto'
    container.appendChild(renderer.domElement)

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambient)
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2)
    dirLight.position.set(2, 2, 2)
    scene.add(dirLight)

    // Load textures
    const textureLoader = new THREE.TextureLoader()
    const texture = textureLoader.load(TEXTURE_URL)
    const normalMap = textureLoader.load(NORMAL_URL)

    // Load model using LegacyJSONLoader
    const loader = new LegacyJSONLoader()
    loader.load(
      MODEL_URL,
      (geometry) => {
        const material = new THREE.MeshStandardMaterial({
          map: texture,
          normalMap: normalMap,
          side: THREE.DoubleSide,
        })
        const mesh = new THREE.Mesh(geometry, material)
        mesh.scale.set(0.03, 0.03, 0.03)
        mesh.position.set(0, -3.5, 0)
        mesh.rotation.set(-1, 0, 0)
        scene.add(mesh)

        // Scroll-driven rotation
        gsap.to(mesh.rotation, {
          z: mesh.rotation.z + Math.PI * 2,
          ease: 'none',
          scrollTrigger: {
            trigger: document.body,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 1,
          },
        })
      },
      (error) => console.error('Model load error:', error)
    )

    // Handle resize
    const handleResize = () => {
      const size = getSize()
      width = size.width
      height = size.height
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }
    window.addEventListener('resize', handleResize)

    // Render loop
    let frameId: number
    const animate = () => {
      frameId = requestAnimationFrame(animate)
      renderer.render(scene, camera)
    }
    animate()

    // Cleanup
    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('resize', handleResize)
      ScrollTrigger.getAll().forEach((t) => t.kill())
      renderer.dispose()
      container.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div
      ref={mountRef}
      style={{
        width: '100%',
        maxWidth: 600,
        margin: '0 auto',
        position: 'relative',
        zIndex: 0,
      }}
    />
  )
}