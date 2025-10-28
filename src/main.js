// OPWV - Organic Particle WebGL Visualizer
// Entry point

import * as THREE from 'three'
import { ParticleSystem } from './particles/ParticleSystem.js'
import { SeededRandom, getSeedFromURL, generateSeed } from './utils/random.js'
import { PerformanceMonitor } from './utils/performance.js'
import { getVRModeFromURL, isWebXRSupported, isVRSessionSupported, getBrowserInfo, requestVRSession, endVRSession } from './utils/webxr.js'

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
  const isHTTP = window.location.protocol === 'http:'
  const isSafari = browserInfo.browser === 'Safari'

  if (isHTTP && isSafari) {
    console.warn('VR mode requested: Safari requires HTTPS for WebXR. Try accessing via https:// instead.')
  } else if (isHTTP) {
    console.warn('VR mode requested: WebXR requires HTTPS in most browsers. Try accessing via https:// instead.')
  } else {
    console.warn('VR mode requested but WebXR not supported in this browser')
  }
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

// WebXR session state
let xrSession = null

// Raycaster for PerspectiveCamera mouse interaction
const raycaster = new THREE.Raycaster()
// Plane at z=0 for raycasting (particles are in XY plane)
const interactionPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)

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
  renderer.xr.setReferenceSpaceType('local') // Stationary viewer at origin
  console.log('WebXR enabled on renderer with local reference space')
}

// Create scene
const scene = new THREE.Scene()

// Create cameras for 2D and VR modes
const aspect = window.innerWidth / window.innerHeight
const frustumSize = 10

// OrthographicCamera for 2D mode (existing MVP behavior)
const camera2D = new THREE.OrthographicCamera(
  (frustumSize * aspect) / -2,  // left
  (frustumSize * aspect) / 2,   // right
  frustumSize / 2,               // top
  frustumSize / -2,              // bottom
  0.1,                           // near
  100                            // far
)
camera2D.position.z = 5

// PerspectiveCamera for VR mode (360° viewing from center)
const camera3D = new THREE.PerspectiveCamera(
  100,                           // fov (VR-appropriate wide angle)
  aspect,                        // aspect ratio
  0.1,                           // near (see close particles)
  1000                           // far (encompass entire particle space)
)
camera3D.position.set(0, 0, 0)   // Center of particle space for 360° viewing

// Select camera based on VR mode
const camera = vrModeRequested ? camera3D : camera2D

// Initialize particle system
// Bounds and particle count depend on mode (2D planar vs 3D spherical)
let bounds
let particleCount

if (vrModeRequested) {
  // VR mode: 3D spherical space surrounding camera at origin
  // Particles distributed in spherical shell between inner and outer radius
  bounds = {
    innerRadius: 5,   // Minimum distance from origin (tuneable: 3-10)
    outerRadius: 20   // Maximum distance from origin (tuneable: 15-30)
  }
  particleCount = 1000  // More particles needed for 360° coverage
} else {
  // 2D mode: Planar rectangular space (backward compatibility)
  // Calculate from orthographic camera frustum
  bounds = {
    minX: camera2D.left,
    maxX: camera2D.right,
    minY: camera2D.bottom,
    maxY: camera2D.top
  }
  particleCount = 500  // Original particle count for 2D
}

const particleSystem = new ParticleSystem(particleCount, bounds, rng)
scene.add(particleSystem.getPoints())

// Clock for delta time (frame-rate independence)
const clock = new THREE.Clock()

// Performance monitoring for adaptive quality
const performanceMonitor = new PerformanceMonitor()

// Render loop (VR-compatible using renderer.setAnimationLoop)
function animate(timestamp) {
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

  // Update camera based on type
  if (camera === camera2D) {
    // OrthographicCamera: Update frustum
    camera2D.left = (frustumSize * aspect) / -2
    camera2D.right = (frustumSize * aspect) / 2
    camera2D.top = frustumSize / 2
    camera2D.bottom = frustumSize / -2
    camera2D.updateProjectionMatrix()
  } else {
    // PerspectiveCamera: Update aspect ratio
    camera3D.aspect = aspect
    camera3D.updateProjectionMatrix()
  }

  // Update renderer size
  renderer.setSize(window.innerWidth, window.innerHeight)
}

window.addEventListener('resize', onWindowResize)

// Mouse interaction handler
function onMouseMove(event) {
  // Normalize mouse coordinates to [-1, 1] (NDC)
  const normalizedX = (event.clientX / window.innerWidth) * 2 - 1
  const normalizedY = -(event.clientY / window.innerHeight) * 2 + 1

  if (camera === camera2D) {
    // OrthographicCamera: Convert NDC to world space using frustum
    const worldX = normalizedX * (camera2D.right - camera2D.left) / 2
    const worldY = normalizedY * (camera2D.top - camera2D.bottom) / 2
    mousePosition = { x: worldX, y: worldY }
  } else {
    // PerspectiveCamera: Use raycaster to find intersection with XY plane
    raycaster.setFromCamera(new THREE.Vector2(normalizedX, normalizedY), camera3D)
    const intersection = new THREE.Vector3()
    raycaster.ray.intersectPlane(interactionPlane, intersection)

    if (intersection) {
      mousePosition = { x: intersection.x, y: intersection.y }
    }
  }
}

// Touch interaction handler
function onTouchMove(event) {
  event.preventDefault()

  // Use first touch point
  if (event.touches.length > 0) {
    const touch = event.touches[0]

    // Normalize touch coordinates to [-1, 1] (NDC)
    const normalizedX = (touch.clientX / window.innerWidth) * 2 - 1
    const normalizedY = -(touch.clientY / window.innerHeight) * 2 + 1

    if (camera === camera2D) {
      // OrthographicCamera: Convert NDC to world space using frustum
      const worldX = normalizedX * (camera2D.right - camera2D.left) / 2
      const worldY = normalizedY * (camera2D.top - camera2D.bottom) / 2
      mousePosition = { x: worldX, y: worldY }
    } else {
      // PerspectiveCamera: Use raycaster to find intersection with XY plane
      raycaster.setFromCamera(new THREE.Vector2(normalizedX, normalizedY), camera3D)
      const intersection = new THREE.Vector3()
      raycaster.ray.intersectPlane(interactionPlane, intersection)

      if (intersection) {
        mousePosition = { x: intersection.x, y: intersection.y }
      }
    }
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

  // End VR session if active
  if (xrSession) {
    endVRSession(xrSession)
    xrSession = null
  }

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
      const onVRButtonClick = async () => {
        if (!xrSession) {
          // Request VR session
          console.log('Requesting VR session...')
          const session = await requestVRSession(renderer)

          if (session) {
            xrSession = session
            vrButton.textContent = 'Exit VR'
            console.log('VR session active')

            // Handle session end (user exits or system ends session)
            session.addEventListener('end', () => {
              xrSession = null
              vrButton.textContent = 'Enter VR'
              console.log('VR session ended by user or system')
            })
          } else {
            console.error('Failed to start VR session')
            alert('Unable to start VR session. Make sure a VR headset is connected.')
          }
        } else {
          // End VR session
          console.log('Ending VR session...')
          await endVRSession(xrSession)
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

// Start animation loop (VR-compatible via renderer.setAnimationLoop)
renderer.setAnimationLoop(animate)
