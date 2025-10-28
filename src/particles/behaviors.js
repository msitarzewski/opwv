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
export function calculateCohesion(particle, neighbors, weight) {
  if (neighbors.length === 0) {
    return new THREE.Vector3(0, 0, 0)
  }

  // Calculate average position of neighbors
  const centerOfMass = new THREE.Vector3(0, 0, 0)
  for (const neighbor of neighbors) {
    centerOfMass.add(neighbor.position)
  }
  centerOfMass.divideScalar(neighbors.length)

  // Steer toward center of mass
  const force = centerOfMass.sub(particle.position)
  force.multiplyScalar(weight)

  return force
}

/**
 * Calculate alignment force - match average velocity of neighbors
 * @param {Particle} particle - The particle to apply force to
 * @param {Particle[]} neighbors - Nearby particles
 * @param {number} weight - Force strength multiplier
 * @returns {THREE.Vector3} - Force to apply to velocity
 */
export function calculateAlignment(particle, neighbors, weight) {
  if (neighbors.length === 0) {
    return new THREE.Vector3(0, 0, 0)
  }

  // Calculate average velocity of neighbors
  const avgVelocity = new THREE.Vector3(0, 0, 0)
  for (const neighbor of neighbors) {
    avgVelocity.add(neighbor.velocity)
  }
  avgVelocity.divideScalar(neighbors.length)

  // Steer toward average velocity
  const force = avgVelocity.sub(particle.velocity)
  force.multiplyScalar(weight)

  return force
}

/**
 * Calculate separation force - avoid crowding neighbors
 * @param {Particle} particle - The particle to apply force to
 * @param {Particle[]} neighbors - Nearby particles
 * @param {number} radius - Separation radius
 * @param {number} weight - Force strength multiplier
 * @returns {THREE.Vector3} - Force to apply to velocity
 */
export function calculateSeparation(particle, neighbors, radius, weight) {
  if (neighbors.length === 0) {
    return new THREE.Vector3(0, 0, 0)
  }

  const force = new THREE.Vector3(0, 0, 0)

  // For each neighbor, add repulsion force
  for (const neighbor of neighbors) {
    const distance = particle.position.distanceTo(neighbor.position)

    // Only separate from very close neighbors
    if (distance > 0 && distance < radius) {
      // Create vector pointing away from neighbor
      const diff = new THREE.Vector3()
        .subVectors(particle.position, neighbor.position)

      // Stronger force when closer (inverse distance)
      diff.normalize()
      diff.divideScalar(distance) // Closer = stronger

      force.add(diff)
    }
  }

  // Average and apply weight
  if (neighbors.length > 0) {
    force.divideScalar(neighbors.length)
  }
  force.multiplyScalar(weight)

  return force
}

/**
 * Calculate user attraction force - steer toward mouse/touch position
 * @param {Particle} particle - The particle to apply force to
 * @param {Object} mousePosition - {x, y} in world coordinates (or null if no interaction)
 * @param {number} strength - Force strength multiplier
 * @param {number} radius - Maximum interaction distance
 * @returns {THREE.Vector3} - Force to apply to velocity
 */
export function calculateUserAttraction(particle, mousePosition, strength, radius) {
  // No interaction if mouse position not available
  if (!mousePosition) {
    return new THREE.Vector3(0, 0, 0)
  }

  // Calculate distance to mouse position
  const mousePos = new THREE.Vector3(mousePosition.x, mousePosition.y, 0)
  const distance = particle.position.distanceTo(mousePos)

  // Only attract particles within radius
  if (distance > radius || distance === 0) {
    return new THREE.Vector3(0, 0, 0)
  }

  // Inverse square falloff for smooth, natural attraction
  // Force = strength / (distance^2 + epsilon)
  // epsilon prevents division by zero when very close
  const epsilon = 0.1
  const forceMagnitude = strength / (distance * distance + epsilon)

  // Create force vector pointing toward mouse
  const force = new THREE.Vector3()
    .subVectors(mousePos, particle.position)
    .normalize()
    .multiplyScalar(forceMagnitude)

  return force
}

/**
 * Wrap position to bounds (toroidal space for 2D)
 * @param {THREE.Vector3} position - Position to wrap
 * @param {Object} bounds - {minX, maxX, minY, maxY}
 */
export function wrapBounds(position, bounds) {
  const width = bounds.maxX - bounds.minX
  const height = bounds.maxY - bounds.minY

  // Wrap X
  if (position.x > bounds.maxX) {
    position.x = bounds.minX + (position.x - bounds.maxX)
  } else if (position.x < bounds.minX) {
    position.x = bounds.maxX + (position.x - bounds.minX)
  }

  // Wrap Y
  if (position.y > bounds.maxY) {
    position.y = bounds.minY + (position.y - bounds.maxY)
  } else if (position.y < bounds.minY) {
    position.y = bounds.maxY + (position.y - bounds.minY)
  }
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
