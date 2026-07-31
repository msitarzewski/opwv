// Pure rotation behavior - 4D rotation for Hypercube
// Used for Hypercube environment: continuous 4D rotation projection

import * as THREE from 'three'

/**
 * Simple 4D vector class for rotation calculations
 */
class Vector4D {
  constructor(x, y, z, w) {
    this.x = x
    this.y = y
    this.z = z
    this.w = w
  }

  // Rotate in XW plane
  rotateXW(angle) {
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    const x = this.x * cos - this.w * sin
    const w = this.x * sin + this.w * cos
    this.x = x
    this.w = w
    return this
  }

  // Rotate in YW plane
  rotateYW(angle) {
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    const y = this.y * cos - this.w * sin
    const w = this.y * sin + this.w * cos
    this.y = y
    this.w = w
    return this
  }

  // Rotate in ZW plane
  rotateZW(angle) {
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    const z = this.z * cos - this.w * sin
    const w = this.z * sin + this.w * cos
    this.z = z
    this.w = w
    return this
  }

  // Project to 3D using perspective projection
  projectTo3D(distance = 2.0, target = new THREE.Vector3()) {
    const denominator = distance - this.w
    const safeDenominator = Math.abs(denominator) < 0.0001
      ? Math.sign(denominator || 1) * 0.0001
      : denominator
    const factor = distance / safeDenominator
    return target.set(
      this.x * factor,
      this.y * factor,
      this.z * factor
    )
  }
}

/**
 * Apply pure 4D rotation behavior to a particle
 * Rotates particle in 4D space and projects to 3D
 *
 * @param {Object} particle - Particle with position and rotation4D (stored 4D position)
 * @param {Object} config - Behavior configuration
 * @param {number} config.rotationSpeedXW - Rotation speed in XW plane
 * @param {number} config.rotationSpeedYW - Rotation speed in YW plane
 * @param {number} config.rotationSpeedZW - Rotation speed in ZW plane
 * @param {number} config.projectionDistance - 4D projection distance
 * @param {number} delta - Time delta
 */
export function apply4DRotation(
  particle,
  config,
  delta,
  positionDelta = new THREE.Vector3(),
  projectedPosition = new THREE.Vector3()
) {
  const {
    rotationSpeedXW = 0.5,
    rotationSpeedYW = 0.3,
    rotationSpeedZW = 0.2,
    projectionDistance = 2.5
  } = config

  // Particle must have rotation4D property (4D position)
  if (!particle.rotation4D) {
    // Initialize from 3D position (w = 0)
    particle.rotation4D = new Vector4D(
      particle.position.x,
      particle.position.y,
      particle.position.z,
      0
    )
  }

  // Apply 4D rotations
  const rotated = particle.rotation4D
    .rotateXW(rotationSpeedXW * delta)
    .rotateYW(rotationSpeedYW * delta)
    .rotateZW(rotationSpeedZW * delta)

  // Store rotated 4D position
  particle.rotation4D = rotated

  // Project to 3D and update position
  rotated.projectTo3D(projectionDistance, projectedPosition)

  // Calculate velocity from position change
  positionDelta.subVectors(projectedPosition, particle.position)
  particle.velocity.copy(positionDelta).divideScalar(delta || 0.0166)
}

export { Vector4D }
