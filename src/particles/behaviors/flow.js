// Flow field behavior - Centripetal vortex forces
// Used for Vortex environment: swirling tornado/funnel dynamics

import * as THREE from 'three'

/**
 * Apply flow field/vortex behavior to a particle
 * Creates swirling vortex motion with centripetal forces
 *
 * @param {Object} particle - Particle with position and velocity
 * @param {Object} config - Behavior configuration
 * @param {THREE.Vector3} config.vortexAxis - Axis of rotation (default: Y-axis)
 * @param {number} config.rotationSpeed - Angular velocity multiplier
 * @param {number} config.centripetalStrength - Pull toward axis strength
 * @param {number} config.upwardDrift - Upward force along axis
 * @param {number} delta - Time delta
 */
export function applyFlowField(particle, config, delta, scratch = null) {
  const {
    vortexAxis = new THREE.Vector3(0, 1, 0), // Y-axis (vertical)
    rotationSpeed = 2.0,
    centripetalStrength = 0.5,
    upwardDrift = 0.5
  } = config

  // Project particle position onto plane perpendicular to axis
  // For Y-axis vortex, this is the XZ plane
  const axisNorm = scratch?.axisNorm || new THREE.Vector3()
  const axisVector = scratch?.axisVector || new THREE.Vector3()
  const radialVector = scratch?.radialVector || new THREE.Vector3()
  const tangent = scratch?.tangent || new THREE.Vector3()
  const totalForce = scratch?.totalForce || new THREE.Vector3()
  axisNorm.copy(vortexAxis).normalize()

  // Radial vector (distance from axis)
  const axisComponent = particle.position.dot(axisNorm)
  axisVector.copy(axisNorm).multiplyScalar(axisComponent)
  radialVector.subVectors(particle.position, axisVector)

  const radius = radialVector.length()

  // Prevent singularity at axis
  if (radius < 0.1) return

  // Tangential direction (perpendicular to both axis and radial)
  tangent.crossVectors(axisNorm, radialVector).normalize()

  // Angular velocity (faster near center)
  const angularVelocity = rotationSpeed / (radius + 0.5)

  // Rotational force (tangential)
  totalForce.copy(tangent).multiplyScalar(angularVelocity)
  totalForce.addScaledVector(radialVector.normalize(), -centripetalStrength)
  totalForce.addScaledVector(axisNorm, upwardDrift)

  // Apply to velocity
  particle.velocity.add(totalForce.multiplyScalar(delta))
}
