// OPWV - Organic Particle WebGL Visualizer
// Entry point

import * as THREE from 'three'
import { XRHandModelFactory } from 'three/addons/webxr/XRHandModelFactory.js'
import { ParticleSystem } from './particles/ParticleSystem.js'
import { EnvironmentManager } from './environments/EnvironmentManager.js'
import { SpatialUI } from './ui/SpatialUI.js'
import { SpeedControl } from './controls/SpeedControl.js'
import { SeededRandom, getSeedFromURL, generateSeed } from './utils/random.js'
import { PerformanceMonitor } from './utils/performance.js'
import { isWebXRSupported, isVRSessionSupported, requestVRSession, endVRSession } from './utils/webxr.js'

// Generate or parse seed for reproducible randomization
const seed = getSeedFromURL() || generateSeed()
const rng = new SeededRandom(seed)
console.log('Seed:', seed, '(use ?seed=' + seed + ' to reproduce this visual)')

// VR-only application: Check WebXR support
const webxrSupported = isWebXRSupported()
console.log('WebXR supported:', webxrSupported)

// Get canvas element
const canvas = document.querySelector('#canvas')

if (!canvas) {
  console.error('Canvas element not found')
  throw new Error('Canvas element not found')
}

// Get VR button element
const vrButton = document.querySelector('#vr-button')

// WebXR session state
let xrSession = null

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

// Add lighting for hand visibility (hands are black meshes without light)
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5)
directionalLight.position.set(1, 1, 1)
scene.add(directionalLight)

console.log('Lighting added for hand visibility')

// VR-only: PerspectiveCamera for immersive 360° viewing
const aspect = window.innerWidth / window.innerHeight
const camera = new THREE.PerspectiveCamera(
  100,                           // fov (VR-appropriate wide angle)
  aspect,                        // aspect ratio
  0.1,                           // near (see close particles)
  1000                           // far (encompass entire particle space)
)
camera.position.set(0, 0, 0)     // Center of particle space for 360° viewing

// Hand tracking setup for VR (Vision Pro, Quest, etc.)
try {
  // Create hand model factory
  const handModelFactory = new XRHandModelFactory()

  // Get hand references from renderer (will be available when VR session starts)
  const hand1 = renderer.xr.getHand(0)
  hand1.add(handModelFactory.createHandModel(hand1, 'mesh'))
  scene.add(hand1)

  const hand2 = renderer.xr.getHand(1)
  hand2.add(handModelFactory.createHandModel(hand2, 'mesh'))
  scene.add(hand2)

  console.log('Hand tracking initialized successfully')
} catch (error) {
  console.error('Failed to initialize hand tracking:', error)
  console.log('App will continue without hand models')
}

// Initialize Speed Control
// VR-04: User-adjustable movement speed (0.25x-2.0x) with localStorage persistence
const speedControl = new SpeedControl({
  lerpDuration: 0.3 // 300ms smooth transitions
})

// Initialize Environment Manager
// VR-01: Environment-based architecture (sphere preset as baseline)
const environmentManager = new EnvironmentManager(scene, camera, renderer, rng, speedControl)

// Performance monitoring for adaptive quality
// VR-only: Target 72fps (Quest 2/3 baseline)
const performanceMonitor = new PerformanceMonitor({
  targetFPS: 72,
  minFPS: 65
})

// Initialize Spatial UI for VR environment selection
// VR-03: Vision Pro-style floating cards with gaze and controller selection
// VR-04: Includes speed control panel
const spatialUI = new SpatialUI(scene, camera, renderer, environmentManager, speedControl)

// Async initialization function (avoids top-level await)
async function initializeEnvironment() {
  try {
    // VR-05: Pre-load all environment presets for spatial UI selection
    // Load all 7 environments in parallel for fast switching
    console.log('Loading environment presets...')

    await Promise.all([
      environmentManager.loadPreset('sphere'),
      environmentManager.loadPreset('nebula'),
      environmentManager.loadPreset('galaxy'),
      environmentManager.loadPreset('lattice'),
      environmentManager.loadPreset('vortex'),
      environmentManager.loadPreset('ocean'),
      environmentManager.loadPreset('hypercube')
    ])

    console.log('All environment presets loaded (7 total)')

    // Switch to sphere preset (baseline environment as default)
    // Note: switchEnvironment handles setting current and initializing particle system
    await environmentManager.switchEnvironment('sphere')

    console.log('Environment initialized successfully')
  } catch (error) {
    console.error('Failed to initialize environment:', error)
    alert('Failed to load particle environment. Please refresh the page.')
  }
}

// Start environment initialization
initializeEnvironment()

// Animation loop state for timestamp-based delta time
let lastFrameTime = null

// Render loop (VR-compatible using renderer.setAnimationLoop)
function animate(timestamp) {
  // Calculate delta time from high-resolution timestamp (VR-synchronized)
  // timestamp is in milliseconds, delta should be in seconds
  let delta = 0
  if (lastFrameTime !== null) {
    delta = (timestamp - lastFrameTime) / 1000 // Convert ms to seconds
  } else {
    // First frame: use default 16.67ms (60fps) as fallback
    delta = 1 / 60
  }
  lastFrameTime = timestamp

  // Record frame for performance monitoring
  performanceMonitor.recordFrame(timestamp)

  // Update speed control (smooth lerping transitions)
  speedControl.update(delta)

  // Update particle system via environment manager
  // VR-only: No mouse/touch interaction (immersive experience)
  // EnvironmentManager applies speed multiplier to delta internally
  environmentManager.update(delta, null)

  // Update spatial UI (gaze and controller input)
  // Get current XR session for controller tracking
  const xrSession = renderer.xr.getSession()
  spatialUI.update(xrSession, delta)

  // Check performance every 60 frames
  if (performanceMonitor.shouldCheck()) {
    if (performanceMonitor.shouldReduceQuality()) {
      const particleSystem = environmentManager.getParticleSystem()
      if (particleSystem) {
        particleSystem.reduceParticleCount(0.15, 100)
      }
    }

    performanceMonitor.reset()
  }

  // Render scene
  renderer.render(scene, camera)
}

// Window resize handler
function onWindowResize() {
  const aspect = window.innerWidth / window.innerHeight

  // VR-only: Update PerspectiveCamera aspect ratio
  camera.aspect = aspect
  camera.updateProjectionMatrix()

  // Update renderer size
  renderer.setSize(window.innerWidth, window.innerHeight)
}

window.addEventListener('resize', onWindowResize)

// Cleanup on page unload
function cleanup() {
  // Remove event listeners
  window.removeEventListener('resize', onWindowResize)
  window.removeEventListener('keydown', onKeyDown)

  // End VR session if active
  if (xrSession) {
    endVRSession(xrSession)
    xrSession = null
  }

  // Dispose Three.js resources
  spatialUI.dispose()
  environmentManager.dispose()
  renderer.dispose()
}

window.addEventListener('beforeunload', cleanup)

// Keyboard controls for UI toggle
// 'M' key toggles the spatial UI menu in VR
function onKeyDown(event) {
  if (event.key === 'm' || event.key === 'M') {
    spatialUI.toggle()
  }
}

window.addEventListener('keydown', onKeyDown)

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
              spatialUI.hide() // Hide UI when exiting VR
              console.log('VR session ended by user or system')
            })

            // Handle session errors
            session.addEventListener('error', (event) => {
              console.error('VR session error:', event)
            })

            // Log session info for debugging
            console.log('Session mode:', session.mode)
            console.log('Session features:', session.enabledFeatures)

            // UI starts hidden - user can look down at toggle orb to reveal UI
            spatialUI.hide()
            console.log('VR session active - look down for UI toggle orb')
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
