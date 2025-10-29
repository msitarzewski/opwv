// Brownian motion behavior - Random walk with drift
// Used for Nebula environment: slow, organic cloud movement

import * as THREE from 'three'

/**
 * Apply Brownian motion behavior to a particle
 * Pure random walk with optional drift and damping
 *
 * @param {Object} particle - Particle with position and velocity
 * @param {Object} config - Behavior configuration
 * @param {number} config.speed - Base random motion speed
 * @param {number} config.damping - Velocity damping factor (0-1)
 * @param {THREE.Vector3|null} config.driftDirection - Optional drift direction
 * @param {number} config.driftStrength - Drift force strength
 * @param {number} delta - Time delta
 */
export function applyBrownianMotion(particle, config, delta) {
  const {
    speed = 0.5,
    damping = 0.98,
    driftDirection = null,
    driftStrength = 0.1
  } = config

  // Random walk force (Brownian motion)
  const randomForce = new THREE.Vector3(
    (Math.random() - 0.5) * speed,
    (Math.random() - 0.5) * speed,
    (Math.random() - 0.5) * speed
  )

  // Apply random force
  particle.velocity.add(randomForce.multiplyScalar(delta))

  // Optional drift (for directional cloud movement)
  if (driftDirection) {
    const drift = driftDirection.clone().multiplyScalar(driftStrength * delta)
    particle.velocity.add(drift)
  }

  // Velocity damping (prevents runaway speeds)
  particle.velocity.multiplyScalar(damping)
}
