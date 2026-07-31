// Wave propagation behavior - Sine wave dynamics
// Used for Ocean environment: undulating water surface

import * as THREE from 'three'

/**
 * Apply wave propagation behavior to a particle
 * Creates undulating wave motion on a horizontal plane
 *
 * @param {Object} particle - Particle with position, velocity, and wavePhase
 * @param {Object} config - Behavior configuration
 * @param {number} config.waveSpeed - Horizontal wave propagation speed
 * @param {number} config.amplitude - Vertical wave height
 * @param {number} config.frequency - Wave oscillation frequency
 * @param {THREE.Vector3} config.waveDirection - Direction of wave propagation
 * @param {number} time - Global time for wave phase
 * @param {number} delta - Time delta
 */
export function applyWaveMotion(
  particle,
  config,
  time,
  delta,
  normalizedDirection = new THREE.Vector3()
) {
  const {
    waveSpeed = 1.0,
    amplitude = 2.0,
    frequency = 0.5,
    waveDirection = new THREE.Vector3(1, 0, 0) // +X direction
  } = config

  // Calculate wave phase based on position and time
  // phase = k·x - ωt (wave equation)
  const k = frequency // Wave number (simplified)
  const omega = waveSpeed * frequency // Angular frequency

  normalizedDirection.copy(waveDirection).normalize()
  const positionPhase = particle.position.dot(normalizedDirection) * k
  const timePhase = omega * time

  const phase = positionPhase - timePhase

  // Vertical oscillation (sine wave)
  const targetHeight = amplitude * Math.sin(phase)

  // Vertical force toward target height
  const heightDifference = targetHeight - particle.position.y
  const verticalForce = heightDifference * 2.0 // Spring-like force

  particle.velocity.y += verticalForce * delta

  // Horizontal drift (wave propagation)
  particle.velocity.x += normalizedDirection.x * waveSpeed * 0.1 * delta
  particle.velocity.z += normalizedDirection.z * waveSpeed * 0.1 * delta

  // Damping
  particle.velocity.multiplyScalar(Math.pow(0.98, delta * 72))
}
