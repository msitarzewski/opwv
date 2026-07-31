// OPWV - Organic Particle WebGL Visualizer
// Entry point

import * as THREE from 'three'
import { EnvironmentManager } from './environments/EnvironmentManager.js'
import { SpatialUI } from './ui/SpatialUI.js'
import { SpeedControl } from './controls/SpeedControl.js'
import { SeededRandom, getSeedFromURL, generateSeed } from './utils/random.js'
import { PerformanceMonitor } from './utils/performance.js'
import { isWebXRSupported, isVRSessionSupported, requestVRSession, endVRSession } from './utils/webxr.js'
import { ParticleInteraction } from './interaction/ParticleInteraction.js'
import { AudioManager } from './audio/AudioManager.js'
import {
  copySceneURL,
  parseSceneSpeed,
  parseSceneState,
  updateSceneURL
} from './utils/sceneState.js'

// Generate or parse seed for reproducible randomization
const generatedSeed = generateSeed()
const initialURLParams = new URLSearchParams(window.location.search)
const explicitSceneSpeed = parseSceneSpeed(initialURLParams.get('speed'))
const explicitAudioValue = initialURLParams.get('audio')
const hasExplicitAudioPreference = ['1', 'true', '0', 'false'].includes(explicitAudioValue)
const initialSceneState = parseSceneState(window.location.search, {
  environmentId: 'sphere',
  seed: getSeedFromURL() ?? generatedSeed,
  speed: 1,
  audioEnabled: false
})
const seed = initialSceneState.seed ?? generatedSeed
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

// Accessible landing controls and status surfaces
const vrButton = document.querySelector('#enter-vr-button')
const xrStatus = document.querySelector('#xr-status')
const appStatus = document.querySelector('#app-status')
const appError = document.querySelector('#app-error')
const pausePreviewButton = document.querySelector('#pause-preview-button')
const shareSceneButton = document.querySelector('#share-scene-button')
const audioToggleButton = document.querySelector('#audio-toggle-button')
const replayTutorialButton = document.querySelector('#replay-tutorial-button')
const environmentList = document.querySelector('#environment-list')
const skipToControlsButton = document.querySelector('#skip-to-controls')

// WebXR session state
let xrSession = null
let vrRequestState = 'idle'
let previewPaused = false
let vrButtonClickHandler = null
let cleanedUp = false

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
const hands = []
try {
  // Three.js exposes tracked joints directly; avoiding the optional mesh factory
  // keeps hand tracking same-origin, offline-capable, and significantly smaller.
  for (let index = 0; index < 2; index++) {
    const hand = renderer.xr.getHand(index)
    scene.add(hand)
    hands.push(hand)
  }

  console.log('Hand tracking initialized successfully')
} catch (error) {
  console.error('Failed to initialize hand tracking:', error)
  console.log('App will continue without hand models')
}

// Initialize Speed Control
// VR-04: User-adjustable movement speed (0.25x-2.0x) with localStorage persistence
const speedControl = new SpeedControl({
  lerpDuration: 0.3,
  initialSpeed: explicitSceneSpeed ?? undefined,
  preferInitialSpeed: explicitSceneSpeed !== null
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
const particleInteraction = new ParticleInteraction({
  hands,
  controllerInput: spatialUI.controllerInput
})
const audioManager = new AudioManager({
  initialEnabled: hasExplicitAudioPreference
    ? initialSceneState.audioEnabled
    : undefined
})

environmentManager.onEnvironmentChange = environment => {
  audioManager.setEnvironment(environment.id)
  performanceMonitor.setTargets(environment.performance)
  spatialUI.updateSelectedCard()
  setEnvironmentSelection(environment.id)
  syncSceneURL()
  setStatus(`${environment.name} is active.`)
}

environmentManager.onTransitionChange = transition => {
  const transitioning = transition.state !== 'idle'
  environmentList?.setAttribute('aria-busy', String(transitioning))
  if (transitioning && transition.targetEnvironmentId) {
    setStatus(`Transitioning to ${transition.targetEnvironmentId}.`)
  }
}

speedControl.onLerpComplete = () => {
  syncSceneURL()
}

audioManager.onStateChange = enabled => {
  updateAudioButton(enabled)
  syncSceneURL()
}

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

    if (cleanedUp) return

    console.log('All environment presets loaded (7 total)')

    // Activate the validated URL-selected environment (sphere by default)
    await environmentManager.switchEnvironment(initialSceneState.environmentId, { immediate: true })
    spatialUI.refreshUIIfNeeded?.()
    setStatus(`${environmentManager.getCurrentEnvironment().name} preview ready.`)

    console.log('Environment initialized successfully')
  } catch (error) {
    if (cleanedUp) return
    console.error('Failed to initialize environment:', error)
    showError('The particle environment could not be loaded. Refresh and try again.')
  }
}

// Start environment initialization
void initializeEnvironment()

// Animation loop state for timestamp-based delta time
let lastFrameTime = null

// Render loop (VR-compatible using renderer.setAnimationLoop)
function animate(timestamp) {
  // Calculate delta time from high-resolution timestamp (VR-synchronized)
  // timestamp is in milliseconds, delta should be in seconds
  let delta
  if (lastFrameTime !== null) {
    delta = Math.min((timestamp - lastFrameTime) / 1000, 0.1)
  } else {
    // First frame: use default 16.67ms (60fps) as fallback
    delta = 1 / 60
  }
  lastFrameTime = timestamp

  // Update speed control (smooth lerping transitions)
  speedControl.update(delta)

  // Update spatial UI (gaze and controller input)
  // Get current XR session for controller tracking
  const activeXRSession = renderer.xr.getSession()
  const interactionSources = particleInteraction.update(activeXRSession)

  if (!previewPaused || activeXRSession) {
    environmentManager.update(delta, interactionSources)
    performanceMonitor.recordFrame(timestamp)
  } else {
    environmentManager.updateTransition(delta)
  }

  spatialUI.update(activeXRSession, delta)

  // Adapt both down and up using percentile frame-time windows.
  if (performanceMonitor.shouldCheck()) {
    const qualityAction = performanceMonitor.evaluateQuality()
    const particleSystem = environmentManager.getParticleSystem()
    if (qualityAction === 'reduce') {
      particleSystem?.reduceParticleCount(0.15, 100)
    } else if (qualityAction === 'increase') {
      particleSystem?.restoreParticleCount?.(0.1)
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
  if (cleanedUp) return
  cleanedUp = true

  // Remove event listeners
  window.removeEventListener('resize', onWindowResize)
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keydown', onInitialTabNavigation, true)
  pausePreviewButton?.removeEventListener('click', onPausePreview)
  shareSceneButton?.removeEventListener('click', onShareScene)
  audioToggleButton?.removeEventListener('click', onToggleAudio)
  replayTutorialButton?.removeEventListener('click', onReplayTutorial)
  environmentList?.removeEventListener('click', onEnvironmentListClick)
  environmentList?.removeEventListener('keydown', onEnvironmentListKeyDown)
  skipToControlsButton?.removeEventListener('click', onSkipToControls)
  if (vrButtonClickHandler) {
    vrButton?.removeEventListener('click', vrButtonClickHandler)
  }

  // End VR session if active
  if (xrSession) {
    void endVRSession(xrSession)
    xrSession = null
  }

  // Dispose Three.js resources
  renderer.setAnimationLoop(null)
  particleInteraction.dispose()
  spatialUI.dispose()
  environmentManager.dispose()
  speedControl.dispose()
  void audioManager.dispose()
  renderer.dispose()
}

window.addEventListener('beforeunload', cleanup)

// Keyboard controls for UI toggle
// 'M' key toggles the spatial UI menu in VR
function onKeyDown(event) {
  if (event.key === 'm' || event.key === 'M') {
    if (renderer.xr.getSession()) {
      spatialUI.toggle()
    }
  } else if (event.key === 'Escape' && environmentManager.isTransitioning()) {
    environmentManager.cancelTransition({ jumpToTarget: true })
  }
}

function onInitialTabNavigation(event) {
  if (
    event.key !== 'Tab'
    || event.shiftKey
    || !skipToControlsButton
    || (
      document.activeElement !== document.body
      && document.activeElement !== document.documentElement
    )
  ) {
    return
  }

  // Safari/WebKit can leave focus on the document when full keyboard access is
  // disabled. Normalize the first forward Tab so the skip control remains usable.
  event.preventDefault()
  skipToControlsButton.focus()
  window.removeEventListener('keydown', onInitialTabNavigation, true)
}

window.addEventListener('keydown', onInitialTabNavigation, true)
window.addEventListener('keydown', onKeyDown)

// VR button setup
void configureVRButton().catch(error => {
  if (cleanedUp) return
  console.error('Failed to configure immersive mode:', error)
  setXRStatus('Immersive mode could not be configured. The live preview remains available.')
})

async function configureVRButton() {
  if (!vrButton) return

  vrButton.disabled = true

  if (!webxrSupported) {
    setXRStatus('Immersive mode is unavailable here. The live preview remains available.')
    vrButton.textContent = 'Headset unavailable'
    return
  }

  setXRStatus('Checking for an immersive headset…')
  const supported = await isVRSessionSupported()
  if (cleanedUp) return
  if (!supported) {
    setXRStatus('Immersive headset unavailable. You can still explore the live preview.')
    vrButton.textContent = 'Headset unavailable'
    return
  }

  setXRStatus('Immersive headset ready.')
  vrButton.disabled = false
  vrButtonClickHandler = () => {
    void onVRButtonClick().catch(error => {
      if (cleanedUp) return
      console.error('Immersive mode action failed:', error)
      vrRequestState = xrSession ? 'active' : 'idle'
      vrButton.disabled = false
      showError('Immersive mode encountered an unexpected error. Please try again.')
    })
  }
  vrButton.addEventListener('click', vrButtonClickHandler)
}

async function onVRButtonClick() {
  if (vrRequestState !== 'idle' && vrRequestState !== 'active') {
    return
  }

  clearError()
  if (audioManager.isEnabled()) {
    try {
      await audioManager.setEnabled(true)
    } catch (error) {
      console.warn('Unable to resume ambient audio:', error)
      await audioManager.setEnabled(false)
    }
  }

  if (!xrSession) {
    vrRequestState = 'requesting'
    vrButton.disabled = true
    setStatus('Requesting immersive mode…')

    const session = await requestVRSession(renderer)
    if (!session) {
      vrRequestState = 'idle'
      vrButton.disabled = false
      showError('Immersive mode could not start. Check headset connection and browser permission.')
      return
    }

    xrSession = session
    vrRequestState = 'active'
    vrButton.disabled = false
    vrButton.textContent = 'Exit immersive mode'
    const landingPanel = document.querySelector('#landing-panel')
    landingPanel?.setAttribute('aria-hidden', 'true')
    if (landingPanel) landingPanel.inert = true
    spatialUI.hide()
    spatialUI.startOnboarding?.()
    performanceMonitor.reset({ resetTimestamp: true, resetAdaptiveState: true })
    setStatus('Immersive mode active.')

    session.addEventListener('end', onVRSessionEnded, { once: true })
    session.addEventListener('error', onVRSessionError)
    return
  }

  vrRequestState = 'ending'
  vrButton.disabled = true
  setStatus('Ending immersive mode…')
  const endingSession = xrSession
  await endVRSession(endingSession)
  if (xrSession === endingSession) {
    onVRSessionEnded({ currentTarget: endingSession })
  }
}

function onVRSessionEnded(event) {
  event?.currentTarget?.removeEventListener?.('error', onVRSessionError)
  xrSession = null
  if (cleanedUp) return

  vrRequestState = 'idle'
  vrButton.disabled = false
  vrButton.textContent = 'Enter immersive mode'
  const landingPanel = document.querySelector('#landing-panel')
  landingPanel?.removeAttribute('aria-hidden')
  if (landingPanel) landingPanel.inert = false
  spatialUI.hide()
  performanceMonitor.reset({ resetTimestamp: true, resetAdaptiveState: true })
  setStatus('Immersive mode ended. Preview active.')
  if (!cleanedUp) {
    vrButton.focus({ preventScroll: true })
  }
}

function onVRSessionError(event) {
  console.error('VR session error:', event)
  showError('The immersive session encountered an error and may need to be restarted.')
}

pausePreviewButton?.addEventListener('click', onPausePreview)
shareSceneButton?.addEventListener('click', onShareScene)
audioToggleButton?.addEventListener('click', onToggleAudio)
replayTutorialButton?.addEventListener('click', onReplayTutorial)
environmentList?.addEventListener('click', onEnvironmentListClick)
environmentList?.addEventListener('keydown', onEnvironmentListKeyDown)
skipToControlsButton?.addEventListener('click', onSkipToControls)

if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
  previewPaused = true
}
updatePauseButton()
updateAudioButton(audioManager.isEnabled())

function onPausePreview() {
  previewPaused = !previewPaused
  performanceMonitor.reset({ resetTimestamp: true })
  updatePauseButton()
  setStatus(previewPaused ? 'Preview paused.' : 'Preview resumed.')
}

async function onShareScene() {
  clearError()
  try {
    await copySceneURL(getCurrentSceneState())
    setStatus('Scene link copied to the clipboard.')
  } catch (error) {
    console.warn('Unable to copy scene URL:', error)
    showError('Clipboard access is unavailable. Copy the current address from your browser.')
  }
}

async function onToggleAudio() {
  clearError()
  try {
    const enabled = audioManager.isEnabled() && !audioManager.isActive()
      ? await audioManager.setEnabled(true)
      : await audioManager.toggle()
    setStatus(enabled ? 'Ambient sound enabled.' : 'Ambient sound disabled.')
  } catch (error) {
    console.warn('Unable to toggle audio:', error)
    showError('Ambient sound is unavailable in this browser.')
  }
}

function onReplayTutorial() {
  if (!renderer.xr.getSession()) {
    setStatus('Enter immersive mode to view the spatial tutorial.')
    return
  }

  spatialUI.startOnboarding?.({ force: true })
}

function onSkipToControls() {
  document.querySelector('#landing-panel')?.focus({ preventScroll: true })
}

function onEnvironmentListClick(event) {
  const button = event.target instanceof Element
    ? event.target.closest('[data-environment]')
    : null
  if (button) {
    void selectEnvironment(button.dataset.environment)
  }
}

function onEnvironmentListKeyDown(event) {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
    return
  }

  event.preventDefault()
  const options = Array.from(environmentList.querySelectorAll('[data-environment]'))
  const currentIndex = Math.max(0, options.indexOf(document.activeElement))
  let nextIndex = currentIndex

  if (event.key === 'ArrowLeft') nextIndex = Math.max(0, currentIndex - 1)
  if (event.key === 'ArrowRight') nextIndex = Math.min(options.length - 1, currentIndex + 1)
  if (event.key === 'Home') nextIndex = 0
  if (event.key === 'End') nextIndex = options.length - 1

  options[nextIndex]?.focus()
  options[nextIndex]?.click()
}

async function selectEnvironment(environmentId) {
  clearError()
  try {
    await environmentManager.switchEnvironment(environmentId)
  } catch (error) {
    console.error('Unable to switch environment:', error)
    showError('That particle world could not be loaded. The current world remains active.')
  }
}

function getCurrentSceneState() {
  return {
    environmentId: environmentManager.getCurrentEnvironment()?.id || initialSceneState.environmentId,
    seed,
    speed: speedControl.getTargetSpeed(),
    audioEnabled: audioManager.isEnabled()
  }
}

function setEnvironmentSelection(environmentId) {
  const options = environmentList?.querySelectorAll('[data-environment]') || []
  for (const option of options) {
    const selected = option.dataset.environment === environmentId
    option.classList.toggle('is-selected', selected)
    option.setAttribute('aria-selected', String(selected))
    option.tabIndex = selected ? 0 : -1
  }
}

function updatePauseButton() {
  if (!pausePreviewButton) return
  pausePreviewButton.setAttribute('aria-pressed', String(previewPaused))
  pausePreviewButton.textContent = previewPaused ? 'Resume preview' : 'Pause preview'
}

function updateAudioButton(enabled) {
  if (!audioToggleButton) return
  audioToggleButton.setAttribute('aria-pressed', String(enabled))
  audioToggleButton.textContent = enabled
    ? audioManager.isActive() ? 'Sound on' : 'Start sound'
    : 'Sound off'
}

function setStatus(message) {
  if (appStatus) appStatus.textContent = message
}

function setXRStatus(message) {
  if (xrStatus) xrStatus.textContent = message
}

function showError(message) {
  if (appError) {
    appError.textContent = message
    appError.hidden = false
  }
  if (renderer.xr.getSession()) {
    spatialUI.showError?.(message)
  }
}

function clearError() {
  if (appError) {
    appError.textContent = ''
    appError.hidden = true
  }
}

function syncSceneURL() {
  try {
    updateSceneURL(getCurrentSceneState())
  } catch (error) {
    console.warn('Unable to synchronize scene URL:', error)
  }
}

// Start animation loop (VR-compatible via renderer.setAnimationLoop)
renderer.setAnimationLoop(animate)
