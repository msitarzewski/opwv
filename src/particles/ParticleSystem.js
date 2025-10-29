// Particle system manager with efficient BufferGeometry rendering
import * as THREE from 'three'
import { Particle } from './Particle.js'
import { calculateCohesion, calculateAlignment, calculateSeparation, calculateUserAttraction, wrapSphericalBounds } from './behaviors.js'
import { NoiseField } from '../utils/noise.js'
import { generatePalette } from '../utils/colors.js'
import { Environment } from '../environments/Environment.js'

// Behavior modules for different environment modes
import { applyBrownianMotion } from './behaviors/brownian.js'
import { applyOrbitalMechanics } from './behaviors/orbital.js'
import { applySpringForce } from './behaviors/spring.js'
import { applyFlowField } from './behaviors/flow.js'
import { applyWaveMotion } from './behaviors/wave.js'
import { apply4DRotation } from './behaviors/rotation.js'

export class ParticleSystem {
  /**
   * Create a particle system with N particles
   *
   * Supports two constructor signatures for backward compatibility:
   * 1. NEW: ParticleSystem(environment, null, rng) - Environment-driven config
   * 2. OLD: ParticleSystem(count, bounds, rng) - Legacy direct parameters
   *
   * @param {Environment|number} countOrEnvironment - Environment instance or particle count
   * @param {Object|null} bounds - Bounds object (legacy) or null (environment mode)
   * @param {SeededRandom} rng - Optional seeded random number generator
   */
  constructor(countOrEnvironment, bounds = null, rng = null) {
    this.particles = []
    this.rng = rng
    this.time = 0

    // Detect constructor mode: Environment instance vs. legacy parameters
    if (countOrEnvironment instanceof Environment) {
      // NEW PATH: Environment-driven configuration
      const env = countOrEnvironment

      // Extract spatial configuration
      this.count = env.spatial.particleCount
      this.bounds = env.spatial.bounds

      // Generate color palette (if rng provided)
      this.palette = rng ? generatePalette(rng, 3) : null

      // Apply behavior configuration from environment
      this.config = {
        cohesionRadius: env.behavior.cohesionRadius,
        cohesionWeight: env.behavior.cohesionWeight,
        alignmentRadius: env.behavior.alignmentRadius,
        alignmentWeight: env.behavior.alignmentWeight,
        separationRadius: env.behavior.separationRadius,
        separationWeight: env.behavior.separationWeight,
        maxSpeed: env.behavior.maxSpeed,
        interactionStrength: 1.0,  // Not yet configurable per environment
        interactionRadius: 4.0      // Not yet configurable per environment
      }

      // Initialize noise field from environment parameters
      this.noiseField = new NoiseField(env.behavior.noiseScale, env.behavior.noiseStrength)

      // Store environment reference for material updates
      this.environment = env

    } else {
      // LEGACY PATH: Direct parameters (backward compatibility)
      this.count = countOrEnvironment
      this.bounds = bounds

      // Generate color palette (if rng provided)
      this.palette = rng ? generatePalette(rng, 3) : null

      // Use hardcoded defaults (existing behavior)
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

      // Hardcoded noise field (existing behavior)
      this.noiseField = new NoiseField(0.5, 0.3)

      this.environment = null
    }

    // Create particle instances
    // Check if environment provides custom initialization function
    const useCustomInit = this.environment && this.environment.spatial.initializationFn

    if (useCustomInit) {
      // Custom initialization path - call initializationFn for each particle
      for (let i = 0; i < this.count; i++) {
        const customProps = this.environment.spatial.initializationFn(this.rng, this.palette, this.bounds)

        // Create particle-like object with custom properties
        // Must have: position (Vector3), velocity (Vector3), color (Color), size (number)
        const particle = {
          position: customProps.position,
          velocity: customProps.velocity,
          color: customProps.color,
          size: customProps.size,
          // Include update method from Particle class
          update: function(delta) {
            this.position.x += this.velocity.x * delta
            this.position.y += this.velocity.y * delta
            this.position.z += this.velocity.z * delta
          }
        }

        this.particles.push(particle)
      }
    } else {
      // Default initialization path - use Particle constructor
      for (let i = 0; i < this.count; i++) {
        this.particles.push(new Particle(this.bounds, this.rng, this.palette))
      }
    }

    // Create BufferGeometry for efficient rendering
    this.geometry = new THREE.BufferGeometry()

    // Position buffer (Float32Array for performance)
    // Each particle has 3 values: x, y, z
    const positions = new Float32Array(this.count * 3)

    // Color buffer (Float32Array)
    // Each particle has 3 values: r, g, b (0-1 range)
    const colors = new Float32Array(this.count * 3)

    // Initialize buffers from particle data
    for (let i = 0; i < this.count; i++) {
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
    // If environment provided, use visual config; otherwise use defaults
    if (this.environment) {
      this.material = new THREE.PointsMaterial({
        size: this.environment.visual.particleSize,
        vertexColors: true,
        transparent: true,
        opacity: this.environment.visual.opacity,
        sizeAttenuation: this.environment.visual.sizeAttenuation
      })
    } else {
      // Legacy defaults (existing behavior)
      this.material = new THREE.PointsMaterial({
        size: 3,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: false
      })
    }

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
   * Apply motion behaviors to a particle (mode-aware)
   * @param {Particle} particle - The particle to apply behaviors to
   * @param {Object} mousePosition - {x, y} in world coordinates (or null)
   * @param {number} delta - Time delta for behavior calculations
   */
  applyBehaviors(particle, mousePosition, delta) {
    // Get behavior mode from environment (default: 'flocking')
    const mode = this.environment ? this.environment.behavior.mode : 'flocking'
    const modeParams = this.environment ? this.environment.behavior.modeParams : {}

    // Apply behavior based on mode
    switch (mode) {
      case 'flocking':
        this.applyFlockingBehavior(particle, mousePosition)
        break

      case 'brownian':
        applyBrownianMotion(particle, modeParams, delta)
        break

      case 'orbital':
        applyOrbitalMechanics(particle, modeParams, delta)
        break

      case 'spring':
        applySpringForce(particle, modeParams, delta)
        break

      case 'flow':
        applyFlowField(particle, modeParams, delta)
        break

      case 'wave':
        applyWaveMotion(particle, modeParams, this.time, delta)
        break

      case 'rotation':
        apply4DRotation(particle, modeParams, delta)
        break

      default:
        console.warn(`Unknown behavior mode: ${mode}, falling back to flocking`)
        this.applyFlockingBehavior(particle, mousePosition)
    }

    // Boundary wrapping (always apply for VR spherical space)
    wrapSphericalBounds(particle.position, this.bounds.innerRadius, this.bounds.outerRadius)
  }

  /**
   * Apply flocking behavior (original behavior)
   * @param {Particle} particle - The particle to apply behaviors to
   * @param {Object} mousePosition - {x, y} in world coordinates (or null)
   */
  applyFlockingBehavior(particle, mousePosition) {
    // Find neighbors for flocking behaviors
    const cohesionNeighbors = this.findNeighbors(particle, this.config.cohesionRadius)
    const alignmentNeighbors = this.findNeighbors(particle, this.config.alignmentRadius)
    const separationNeighbors = this.findNeighbors(particle, this.config.separationRadius)

    // Calculate flocking forces
    const cohesion = calculateCohesion(particle, cohesionNeighbors, this.config.cohesionWeight)
    const alignment = calculateAlignment(particle, alignmentNeighbors, this.config.alignmentWeight)
    const separation = calculateSeparation(particle, separationNeighbors, this.config.separationRadius, this.config.separationWeight)

    // 3D noise for spherical space
    const noise = this.noiseField.get3D(particle.position.x, particle.position.y, particle.position.z, this.time)
    const noiseForce = new THREE.Vector3(noise.x, noise.y, noise.z)

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

      // Apply motion behaviors (mode-aware)
      this.applyBehaviors(particle, mousePosition, delta)

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
