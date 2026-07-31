// Orbital mechanics behavior - Gravitational physics
// Used for Galaxy environment: particles orbit around galactic center

import * as THREE from 'three'

/**
 * Apply orbital/gravitational behavior to a particle
 * Simulates orbital mechanics around a central mass
 *
 * @param {Object} particle - Particle with position and velocity
 * @param {Object} config - Behavior configuration
 * @param {THREE.Vector3} config.centerOfMass - Gravitational center (usually origin)
 * @param {number} config.gravitationalConstant - G constant (affects orbital speed)
 * @param {number} config.centralMass - Mass at center (larger = stronger gravity)
 * @param {number} config.dragCoefficient - Orbital decay/damping
 * @param {number} delta - Time delta
 */
export function applyOrbitalMechanics(
  particle,
  config,
  delta,
  toCenter = new THREE.Vector3()
) {
  const {
    centerOfMass = new THREE.Vector3(0, 0, 0),
    gravitationalConstant = 50.0,
    centralMass = 1.0,
    dragCoefficient = 0.999 // Slight orbital decay
  } = config

  // Vector from particle to center
  toCenter.subVectors(centerOfMass, particle.position)
  const distance = toCenter.length()

  // Prevent division by zero and singularity at center
  if (distance < 0.1) return

  // Gravitational force: F = G * M * m / r²
  // Simplified: m (particle mass) = 1
  const forceMagnitude = (gravitationalConstant * centralMass) / (distance * distance)

  // Normalize and apply force
  // Apply force to velocity (F = ma, a = F/m, m = 1)
  particle.velocity.addScaledVector(toCenter.normalize(), forceMagnitude * delta)

  // Orbital drag (slight decay for stability)
  particle.velocity.multiplyScalar(Math.pow(dragCoefficient, delta * 72))
}
