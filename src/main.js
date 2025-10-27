// OPWV - Organic Particle WebGL Visualizer
// Entry point

import * as THREE from 'three'
import { ParticleSystem } from './particles/ParticleSystem.js'
import { SeededRandom, getSeedFromURL, generateSeed } from './utils/random.js'
import { PerformanceMonitor } from './utils/performance.js'
import { getVRModeFromURL, isWebXRSupported, isVRSessionSupported, getBrowserInfo } from './utils/webxr.js'

// Generate or parse seed for reproducible randomization
const seed = getSeedFromURL() || generateSeed()
const rng = new SeededRandom(seed)
console.log('Seed:', seed, '(use ?seed=' + seed + ' to reproduce this visual)')

// Check for VR mode request
const vrModeRequested = getVRModeFromURL()
const webxrSupported = isWebXRSupported()
const browserInfo = getBrowserInfo()

console.log('WebXR supported:', webxrSupported, '(' + browserInfo.browser + ')')
if (vrModeRequested && !webxrSupported) {
  console.warn('VR mode requested but WebXR not supported in this browser')
}

// Get canvas element
const canvas = document.querySelector('#canvas')

if (!canvas) {
  console.error('Canvas element not found')
  throw new Error('Canvas element not found')
}

// Get VR button element
const vrButton = document.querySelector('#vr-button')

// Mouse/touch position in world coordinates (null when no interaction)
let mousePosition = null

// Initialize Three.js renderer
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true
})

// Clamp pixel ratio to max 2 for performance
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setSize(window.innerWidth, window.innerHeight)

// Enable WebXR support if available
if (webxrSupported) {
  renderer.xr.enabled = true
  console.log('WebXR enabled on renderer')
}

// Create scene
const scene = new THREE.Scene()

// Create orthographic camera (2D-style view for particles)
const aspect = window.innerWidth / window.innerHeight
const frustumSize = 10
const camera = new THREE.OrthographicCamera(
  (frustumSize * aspect) / -2,  // left
  (frustumSize * aspect) / 2,   // right
  frustumSize / 2,               // top
  frustumSize / -2,              // bottom
  0.1,                           // near
  100                            // far
)
camera.position.z = 5

// Initialize particle system
// Calculate viewport bounds from camera frustum
const bounds = {
  minX: camera.left,
  maxX: camera.right,
  minY: camera.bottom,
  maxY: camera.top
}

const particleSystem = new ParticleSystem(500, bounds, rng)
scene.add(particleSystem.getPoints())

// Clock for delta time (frame-rate independence)
const clock = new THREE.Clock()

// Performance monitoring for adaptive quality
const performanceMonitor = new PerformanceMonitor()

// Render loop
function animate(timestamp) {
  requestAnimationFrame(animate)

  const delta = clock.getDelta()

  // Record frame for performance monitoring
  performanceMonitor.recordFrame(timestamp)

  // Update particle system with mouse interaction
  particleSystem.update(delta, mousePosition)

  // Check performance every 60 frames
  if (performanceMonitor.shouldCheck()) {
    if (performanceMonitor.shouldReduceQuality()) {
      particleSystem.reduceParticleCount(0.15, 100)
    }

    performanceMonitor.reset()
  }

  // Render scene
  renderer.render(scene, camera)
}

// Window resize handler
function onWindowResize() {
  const aspect = window.innerWidth / window.innerHeight

  // Update camera frustum
  camera.left = (frustumSize * aspect) / -2
  camera.right = (frustumSize * aspect) / 2
  camera.top = frustumSize / 2
  camera.bottom = frustumSize / -2
  camera.updateProjectionMatrix()

  // Update renderer size
  renderer.setSize(window.innerWidth, window.innerHeight)
}

window.addEventListener('resize', onWindowResize)

// Mouse interaction handler
function onMouseMove(event) {
  // Normalize mouse coordinates to [-1, 1]
  const normalizedX = (event.clientX / window.innerWidth) * 2 - 1
  const normalizedY = -(event.clientY / window.innerHeight) * 2 + 1

  // Convert to world space using camera frustum
  const worldX = normalizedX * (camera.right - camera.left) / 2
  const worldY = normalizedY * (camera.top - camera.bottom) / 2

  mousePosition = { x: worldX, y: worldY }
}

// Touch interaction handler
function onTouchMove(event) {
  event.preventDefault()

  // Use first touch point
  if (event.touches.length > 0) {
    const touch = event.touches[0]

    // Normalize touch coordinates to [-1, 1]
    const normalizedX = (touch.clientX / window.innerWidth) * 2 - 1
    const normalizedY = -(touch.clientY / window.innerHeight) * 2 + 1

    // Convert to world space using camera frustum
    const worldX = normalizedX * (camera.right - camera.left) / 2
    const worldY = normalizedY * (camera.top - camera.bottom) / 2

    mousePosition = { x: worldX, y: worldY }
  }
}

window.addEventListener('mousemove', onMouseMove)
window.addEventListener('touchstart', onTouchMove)
window.addEventListener('touchmove', onTouchMove)

// Cleanup on page unload
function cleanup() {
  // Remove event listeners
  window.removeEventListener('resize', onWindowResize)
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('touchstart', onTouchMove)
  window.removeEventListener('touchmove', onTouchMove)

  // Dispose Three.js resources
  particleSystem.dispose()
  renderer.dispose()
}

window.addEventListener('beforeunload', cleanup)

// VR button setup
if (vrButton && webxrSupported) {
  // Check VR session support asynchronously
  isVRSessionSupported().then(supported => {
    if (supported) {
      // Show button if VR sessions are supported
      vrButton.style.display = 'block'
      console.log('VR sessions supported - button visible')

      // Handle VR button click
      const onVRButtonClick = () => {
        if (!vrModeRequested) {
          // Redirect to VR mode via URL parameter
          const url = new URL(window.location)
          url.searchParams.set('mode', 'vr')
          window.location.href = url.toString()
        } else {
          // Already in VR mode - show message for future VR session initiation
          console.log('VR mode active - VR session will be initiated in XR-03')
          alert('VR mode active. Full VR session support coming in XR-03.')
        }
      }

      vrButton.addEventListener('click', onVRButtonClick)

      // Add cleanup for VR button
      const originalCleanup = cleanup
      cleanup = function() {
        vrButton.removeEventListener('click', onVRButtonClick)
        originalCleanup()
      }
    } else {
      console.log('VR sessions not supported - button hidden')
    }
  })
}

// Start animation loop
animate(performance.now())
