// WebXR utilities for VR mode detection and setup
// Provides WebXR capability checks and URL parameter parsing for VR mode entry

/**
 * Parse VR mode from URL parameter
 * @returns {boolean} True if ?mode=vr is present in URL
 * @example
 * // URL: http://localhost:3001/?mode=vr
 * getVRModeFromURL() // returns true
 *
 * // URL: http://localhost:3001/
 * getVRModeFromURL() // returns false
 */
export function getVRModeFromURL() {
  const params = new URLSearchParams(window.location.search)
  const mode = params.get('mode')
  return mode === 'vr'
}

/**
 * Check if WebXR is supported in the current browser
 * @returns {boolean} True if navigator.xr exists
 */
export function isWebXRSupported() {
  return 'xr' in navigator
}

/**
 * Check if immersive VR sessions are supported
 * @returns {Promise<boolean>} Resolves to true if 'immersive-vr' sessions are supported
 * @example
 * const supported = await isVRSessionSupported()
 * if (supported) {
 *   console.log('VR headset can be used')
 * }
 */
export async function isVRSessionSupported() {
  if (!isWebXRSupported()) {
    return false
  }

  try {
    const supported = await navigator.xr.isSessionSupported('immersive-vr')
    return supported
  } catch (error) {
    console.warn('WebXR session check failed:', error)
    return false
  }
}

/**
 * Get browser WebXR compatibility info
 * @returns {Object} Browser name and WebXR support status
 */
export function getBrowserInfo() {
  const ua = navigator.userAgent
  let browser = 'Unknown'

  if (ua.indexOf('Chrome') > -1 && ua.indexOf('Edg') === -1) {
    browser = 'Chrome'
  } else if (ua.indexOf('Edg') > -1) {
    browser = 'Edge'
  } else if (ua.indexOf('Firefox') > -1) {
    browser = 'Firefox'
  } else if (ua.indexOf('Safari') > -1) {
    browser = 'Safari'
  }

  return {
    browser,
    webxrSupported: isWebXRSupported()
  }
}

/**
 * Request immersive VR session
 * @param {THREE.WebGLRenderer} renderer - Three.js renderer with xr enabled
 * @returns {Promise<XRSession|null>} VR session or null on failure
 * @example
 * const session = await requestVRSession(renderer)
 * if (session) {
 *   console.log('VR session active')
 * }
 */
export async function requestVRSession(renderer) {
  if (!isWebXRSupported()) {
    console.error('WebXR not supported in this browser')
    return null
  }

  try {
    // Request immersive VR session with optional features
    const session = await navigator.xr.requestSession('immersive-vr', {
      optionalFeatures: ['local-floor', 'bounded-floor']
    })

    // Connect session to Three.js WebXRManager
    await renderer.xr.setSession(session)
    console.log('VR session started successfully')
    return session
  } catch (error) {
    console.error('Failed to start VR session:', error.message)
    return null
  }
}

/**
 * End VR session gracefully
 * @param {XRSession} session - Active VR session to end
 * @returns {Promise<void>}
 * @example
 * await endVRSession(xrSession)
 * console.log('VR session ended')
 */
export async function endVRSession(session) {
  if (!session) {
    console.warn('No active VR session to end')
    return
  }

  try {
    await session.end()
    console.log('VR session ended gracefully')
  } catch (error) {
    console.warn('Error ending VR session:', error.message)
  }
}
