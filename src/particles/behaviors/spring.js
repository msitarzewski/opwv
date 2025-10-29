// Spring physics behavior - Hooke's law anchoring
// Used for Lattice environment: particles attached to grid points

import * as THREE from 'three'

/**
 * Apply spring force behavior to a particle
 * Pulls particle toward anchor point like a spring
 *
 * @param {Object} particle - Particle with position, velocity, and anchorPoint
 * @param {Object} config - Behavior configuration
 * @param {number} config.springConstant - Spring stiffness (k in Hooke's law)
 * @param {number} config.damping - Velocity damping (prevents oscillation)
 * @param {number} config.maxForce - Maximum spring force magnitude
 * @param {number} delta - Time delta
 */
export function applySpringForce(particle, config, delta) {
  const {
    springConstant = 2.0,
    damping = 0.95,
    maxForce = 10.0
  } = config

  // Particle must have anchorPoint defined (set during initialization)
  if (!particle.anchorPoint) {
    console.warn('Spring behavior requires particle.anchorPoint')
    return
  }

  // Displacement from anchor (rest length = 0)
  const displacement = new THREE.Vector3().subVectors(
    particle.anchorPoint,
    particle.position
  )

  // Hooke's law: F = -k * x
  const springForce = displacement.multiplyScalar(springConstant)

  // Clamp force magnitude
  if (springForce.length() > maxForce) {
    springForce.normalize().multiplyScalar(maxForce)
  }

  // Apply spring force to velocity
  particle.velocity.add(springForce.multiplyScalar(delta))

  // Damping (prevents endless oscillation)
  particle.velocity.multiplyScalar(damping)
}
