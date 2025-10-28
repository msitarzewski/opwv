// Particle system manager with efficient BufferGeometry rendering
import * as THREE from 'three'
import { Particle } from './Particle.js'
import { calculateCohesion, calculateAlignment, calculateSeparation, calculateUserAttraction, wrapBounds, wrapSphericalBounds } from './behaviors.js'
import { NoiseField } from '../utils/noise.js'
import { generatePalette } from '../utils/colors.js'

export class ParticleSystem {
  /**
   * Create a particle system with N particles
   * @param {number} count - Number of particles to create
   * @param {Object} bounds - {minX, maxX, minY, maxY} viewport bounds
   * @param {SeededRandom} rng - Optional seeded random number generator
   */
  constructor(count, bounds, rng = null) {
    this.count = count
    this.bounds = bounds
    this.particles = []
    this.rng = rng

    // Generate color palette (if rng provided)
    this.palette = rng ? generatePalette(rng, 3) : null

    // Behavior configuration for organic motion
    this.config = {
      cohesionRadius: 2.0,
      cohesionWeight: 0.05,
      alignmentRadius: 2.0,
      alignmentWeight: 0.05,
      separationRadius: 1.0,
      separationWeight: 0.1,
      maxSpeed: 2.0,
      interactionStrength: 1.0,
      interactionRadius: 4.0
    }

    // Noise field for organic drift
    this.noiseField = new NoiseField(0.5, 0.3) // scale, strength

    // Time tracking for noise animation
    this.time = 0

    // Create particle instances
    for (let i = 0; i < count; i++) {
      this.particles.push(new Particle(bounds, this.rng, this.palette))
    }

    // Create BufferGeometry for efficient rendering
    this.geometry = new THREE.BufferGeometry()

    // Position buffer (Float32Array for performance)
    // Each particle has 3 values: x, y, z
    const positions = new Float32Array(count * 3)

    // Color buffer (Float32Array)
    // Each particle has 3 values: r, g, b (0-1 range)
    const colors = new Float32Array(count * 3)

    // Initialize buffers from particle data
    for (let i = 0; i < count; i++) {
      const particle = this.particles[i]
      const i3 = i * 3

      // Position
      positions[i3] = particle.position.x
      positions[i3 + 1] = particle.position.y
      positions[i3 + 2] = particle.position.z

      // Color
      colors[i3] = particle.color.r
      colors[i3 + 1] = particle.color.g
      colors[i3 + 2] = particle.color.b
    }

    // Set attributes on geometry
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    // Create PointsMaterial
    this.material = new THREE.PointsMaterial({
      size: 3, // Base size in pixels (individual sizes in MVP-05+)
      vertexColors: true, // Use color attribute from geometry
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: false // Constant size regardless of camera distance
    })

    // Create Points mesh (single draw call for all particles)
    this.points = new THREE.Points(this.geometry, this.material)
  }

  /**
   * Find neighbors within radius of a particle
   * @param {Particle} particle - The particle to find neighbors for
   * @param {number} radius - Search radius
   * @returns {Particle[]} - Array of nearby particles
   */
  findNeighbors(particle, radius) {
    const neighbors = []
    const radiusSquared = radius * radius

    for (const other of this.particles) {
      if (other === particle) continue

      const distSquared = particle.position.distanceToSquared(other.position)
      if (distSquared < radiusSquared) {
        neighbors.push(other)
      }
    }

    return neighbors
  }

  /**
   * Apply organic motion behaviors to a particle
   * @param {Particle} particle - The particle to apply behaviors to
   * @param {Object} mousePosition - {x, y} in world coordinates (or null)
   */
  applyBehaviors(particle, mousePosition) {
    // Find neighbors for flocking behaviors
    const cohesionNeighbors = this.findNeighbors(particle, this.config.cohesionRadius)
    const alignmentNeighbors = this.findNeighbors(particle, this.config.alignmentRadius)
    const separationNeighbors = this.findNeighbors(particle, this.config.separationRadius)

    // Calculate flocking forces
    const cohesion = calculateCohesion(particle, cohesionNeighbors, this.config.cohesionWeight)
    const alignment = calculateAlignment(particle, alignmentNeighbors, this.config.alignmentWeight)
    const separation = calculateSeparation(particle, separationNeighbors, this.config.separationRadius, this.config.separationWeight)

    // Check if bounds are spherical (3D) or planar (2D)
    const isSpherical = this.bounds.innerRadius !== undefined && this.bounds.outerRadius !== undefined

    // Apply noise for organic drift
    let noiseForce
    if (isSpherical) {
      // 3D noise for spherical space
      const noise = this.noiseField.get3D(particle.position.x, particle.position.y, particle.position.z, this.time)
      noiseForce = new THREE.Vector3(noise.x, noise.y, noise.z)
    } else {
      // 2D noise for planar space (backward compatibility)
      const noise = this.noiseField.get(particle.position.x, particle.position.y, this.time)
      noiseForce = new THREE.Vector3(noise.x, noise.y, 0)
    }

    // Calculate user interaction force
    const userAttraction = calculateUserAttraction(particle, mousePosition, this.config.interactionStrength, this.config.interactionRadius)

    // Accumulate all forces to velocity
    particle.velocity.add(cohesion)
    particle.velocity.add(alignment)
    particle.velocity.add(separation)
    particle.velocity.add(noiseForce)
    particle.velocity.add(userAttraction)

    // Clamp velocity to max speed
    if (particle.velocity.length() > this.config.maxSpeed) {
      particle.velocity.normalize().multiplyScalar(this.config.maxSpeed)
    }

    // Wrap around boundaries (mode-dependent)
    if (isSpherical) {
      wrapSphericalBounds(particle.position, this.bounds.innerRadius, this.bounds.outerRadius)
    } else {
      wrapBounds(particle.position, this.bounds)
    }
  }

  /**
   * Update all particles and sync BufferGeometry attributes
   * @param {number} delta - Time elapsed since last frame (seconds)
   * @param {Object} mousePosition - {x, y} in world coordinates (or null)
   */
  update(delta, mousePosition = null) {
    // Increment time for noise animation
    this.time += delta

    const positions = this.geometry.attributes.position.array

    // Update each particle and write to buffer
    for (let i = 0; i < this.count; i++) {
      const particle = this.particles[i]

      // Apply organic motion behaviors (including user interaction)
      this.applyBehaviors(particle, mousePosition)

      // Update position based on velocity
      particle.update(delta)

      const i3 = i * 3
      positions[i3] = particle.position.x
      positions[i3 + 1] = particle.position.y
      positions[i3 + 2] = particle.position.z
    }

    // Mark attribute as needing update for GPU
    this.geometry.attributes.position.needsUpdate = true
  }

  /**
   * Get the THREE.Points object to add to scene
   * @returns {THREE.Points}
   */
  getPoints() {
    return this.points
  }

  /**
   * Get current active particle count
   * @returns {number} - Number of actively updated particles
   */
  getActiveCount() {
    return this.count
  }

  /**
   * Reduce particle count by percentage for adaptive quality
   * @param {number} reductionRate - Percentage to reduce (0-1, default: 0.15)
   * @param {number} minCount - Minimum particle count (default: 100)
   * @returns {number} - New particle count
   */
  reduceParticleCount(reductionRate = 0.15, minCount = 100) {
    const newCount = Math.floor(this.count * (1 - reductionRate))
    const clampedCount = Math.max(newCount, minCount)

    if (clampedCount < this.count) {
      this.count = clampedCount
    }

    return this.count
  }

  /**
   * Dispose resources for cleanup
   */
  dispose() {
    this.geometry.dispose()
    this.material.dispose()
  }
}
