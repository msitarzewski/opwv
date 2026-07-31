// Flocking behaviors for organic particle motion
// Based on Craig Reynolds' Boids algorithm
import * as THREE from 'three'

/**
 * Calculate cohesion force - steer toward average position of neighbors
 * @param {Particle} particle - The particle to apply force to
 * @param {Particle[]} neighbors - Nearby particles
 * @param {number} weight - Force strength multiplier
 * @returns {THREE.Vector3} - Force to apply to velocity
 */
export function calculateCohesion(particle, neighbors, weight, target = new THREE.Vector3()) {
  target.set(0, 0, 0)
  if (neighbors.length === 0) {
    return target
  }

  // Calculate average position of neighbors
  for (const neighbor of neighbors) {
    target.add(neighbor.position)
  }
  target.divideScalar(neighbors.length)

  // Steer toward center of mass
  return target.sub(particle.position).multiplyScalar(weight)
}

/**
 * Calculate alignment force - match average velocity of neighbors
 * @param {Particle} particle - The particle to apply force to
 * @param {Particle[]} neighbors - Nearby particles
 * @param {number} weight - Force strength multiplier
 * @returns {THREE.Vector3} - Force to apply to velocity
 */
export function calculateAlignment(particle, neighbors, weight, target = new THREE.Vector3()) {
  target.set(0, 0, 0)
  if (neighbors.length === 0) {
    return target
  }

  // Calculate average velocity of neighbors
  for (const neighbor of neighbors) {
    target.add(neighbor.velocity)
  }
  target.divideScalar(neighbors.length)

  // Steer toward average velocity
  return target.sub(particle.velocity).multiplyScalar(weight)
}

/**
 * Calculate separation force - avoid crowding neighbors
 * @param {Particle} particle - The particle to apply force to
 * @param {Particle[]} neighbors - Nearby particles
 * @param {number} radius - Separation radius
 * @param {number} weight - Force strength multiplier
 * @returns {THREE.Vector3} - Force to apply to velocity
 */
export function calculateSeparation(
  particle,
  neighbors,
  radius,
  weight,
  target = new THREE.Vector3(),
  scratch = new THREE.Vector3()
) {
  target.set(0, 0, 0)
  if (neighbors.length === 0) {
    return target
  }

  // For each neighbor, add repulsion force
  for (const neighbor of neighbors) {
    const distance = particle.position.distanceTo(neighbor.position)

    // Only separate from very close neighbors
    if (distance > 0 && distance < radius) {
      // Create vector pointing away from neighbor
      scratch.subVectors(particle.position, neighbor.position)

      // Stronger force when closer (inverse distance)
      scratch.normalize()
      scratch.divideScalar(distance) // Closer = stronger

      target.add(scratch)
    }
  }

  // Average and apply weight
  if (neighbors.length > 0) {
    target.divideScalar(neighbors.length)
  }
  return target.multiplyScalar(weight)
}

/**
 * Calculate user attraction force - steer toward mouse/touch position
 * @param {Particle} particle - The particle to apply force to
 * @param {Object} mousePosition - {x, y} in world coordinates (or null if no interaction)
 * @param {number} strength - Force strength multiplier
 * @param {number} radius - Maximum interaction distance
 * @returns {THREE.Vector3} - Force to apply to velocity
 */
export function calculateUserAttraction(
  particle,
  mousePosition,
  strength,
  radius,
  target = new THREE.Vector3()
) {
  target.set(0, 0, 0)
  // No interaction if mouse position not available
  if (!mousePosition) {
    return target
  }

  target.set(mousePosition.x, mousePosition.y, mousePosition.z || 0)
  const distance = particle.position.distanceTo(target)

  // Only attract particles within radius
  if (distance > radius || distance === 0) {
    return target.set(0, 0, 0)
  }

  // Inverse square falloff for smooth, natural attraction
  // Force = strength / (distance^2 + epsilon)
  // epsilon prevents division by zero when very close
  const epsilon = 0.1
  const forceMagnitude = strength / (distance * distance + epsilon)

  // Create force vector pointing toward mouse
  return target
    .sub(particle.position)
    .normalize()
    .multiplyScalar(forceMagnitude)
}

/**
 * Calculate a normalized 3D attraction or repulsion force.
 * @param {Object} particle - Particle receiving the force
 * @param {Object} source - {position, mode, strength, radius}
 * @param {THREE.Vector3} target - Reusable result vector
 * @returns {THREE.Vector3}
 */
export function calculateUserInteraction(particle, source, target = new THREE.Vector3()) {
  target.set(0, 0, 0)
  if (!source || !source.position) return target

  const radius = Number.isFinite(source.radius) ? Math.max(0, source.radius) : 4
  const strength = Number.isFinite(source.strength) ? source.strength : 1
  const distanceSquared = particle.position.distanceToSquared(source.position)
  if (distanceSquared === 0 || distanceSquared > radius * radius) return target

  const direction = source.mode === 'repel' ? -1 : 1
  const forceMagnitude = direction * strength / (distanceSquared + 0.1)
  return target
    .subVectors(source.position, particle.position)
    .normalize()
    .multiplyScalar(forceMagnitude)
}

/**
 * Wrap position to spherical bounds (3D space)
 * When particle exceeds outer radius, wrap to opposite side at inner radius
 * @param {THREE.Vector3} position - Position to wrap (modified in-place)
 * @param {number} innerRadius - Inner boundary radius
 * @param {number} outerRadius - Outer boundary radius
 */
export function wrapSphericalBounds(position, innerRadius, outerRadius) {
  const distance = position.length()

  // If particle exceeds outer radius, wrap to opposite side at inner radius
  if (distance > outerRadius) {
    // Normalize to get direction, then flip and scale to inner radius
    position.normalize().multiplyScalar(-innerRadius)
  }
}
