// Environment manager - Orchestrates multiple spatial environments
// Handles loading, switching, and particle system coordination

import { ParticleSystem } from '../particles/ParticleSystem.js'
import { Environment } from './Environment.js'

/**
 * EnvironmentManager class - Manages multiple environments and particle system lifecycle
 *
 * Responsibilities:
 * - Load environment presets from presets/ directory
 * - Manage current environment state
 * - Coordinate environment switching
 * - Create and destroy ParticleSystem instances
 * - Prepare for transitions (future: VR-07)
 */
export class EnvironmentManager {
  /**
   * Create an environment manager
   * @param {THREE.Scene} scene - Three.js scene to add particles to
   * @param {THREE.Camera} camera - Active camera (for future spatial UI)
   * @param {THREE.WebGLRenderer} renderer - Three.js renderer
   * @param {SeededRandom} rng - Seeded random number generator for reproducibility
   */
  constructor(scene, camera, renderer, rng) {
    this.scene = scene
    this.camera = camera
    this.renderer = renderer
    this.rng = rng

    // Environment state
    this.availableEnvironments = new Map() // presetId -> Environment
    this.currentEnvironment = null
    this.particleSystem = null
  }

  /**
   * Load an environment preset by ID
   * @param {string} presetId - Preset identifier (e.g., 'sphere', 'nebula')
   * @returns {Promise<Environment>} - Loaded environment instance
   * @throws {Error} If preset cannot be loaded
   */
  async loadPreset(presetId) {
    try {
      // Dynamic import from presets directory
      const presetModule = await import(`./presets/${presetId}.js`)
      const presetConfig = presetModule.default

      // Create Environment instance from preset config
      const environment = new Environment(presetConfig)

      // Store in available environments
      this.availableEnvironments.set(presetId, environment)

      console.log(`Environment preset loaded: ${presetId} (${environment.name})`)

      return environment
    } catch (error) {
      console.error(`Failed to load environment preset: ${presetId}`, error)
      throw new Error(`Environment preset '${presetId}' not found or invalid`)
    }
  }

  /**
   * Get the currently active environment
   * @returns {Environment|null} - Current environment or null if none active
   */
  getCurrentEnvironment() {
    return this.currentEnvironment
  }

  /**
   * Get all available loaded environments
   * @returns {Map<string, Environment>} - Map of presetId -> Environment
   */
  getAvailableEnvironments() {
    return this.availableEnvironments
  }

  /**
   * Switch to a different environment
   * @param {string} presetId - Preset identifier to switch to
   * @returns {Promise<void>}
   * @throws {Error} If preset not loaded or switch fails
   *
   * Note: Current implementation does immediate switch (no transition animation)
   * VR-07 will add transition effects (fade, particle morphing, etc.)
   */
  async switchEnvironment(presetId) {
    // Check if preset is loaded
    if (!this.availableEnvironments.has(presetId)) {
      // Attempt to load preset if not already available
      await this.loadPreset(presetId)
    }

    const newEnvironment = this.availableEnvironments.get(presetId)

    if (!newEnvironment) {
      throw new Error(`Environment '${presetId}' could not be loaded`)
    }

    // Destroy current particle system
    this.destroyParticleSystem()

    // Set new environment as current
    this.currentEnvironment = newEnvironment

    // Initialize new particle system from environment
    this.initializeParticleSystem()

    console.log(`Switched to environment: ${presetId} (${newEnvironment.name})`)
  }

  /**
   * Initialize particle system from current environment
   * Creates ParticleSystem instance and adds to scene
   * @throws {Error} If no current environment set
   */
  initializeParticleSystem() {
    if (!this.currentEnvironment) {
      throw new Error('Cannot initialize particle system: No environment set')
    }

    // Create particle system from environment configuration
    this.particleSystem = new ParticleSystem(this.currentEnvironment, null, this.rng)

    // Add particle Points mesh to scene
    this.scene.add(this.particleSystem.getPoints())

    console.log(`Particle system initialized: ${this.currentEnvironment.spatial.particleCount} particles`)
  }

  /**
   * Destroy current particle system
   * Removes from scene and disposes GPU resources
   */
  destroyParticleSystem() {
    if (this.particleSystem) {
      // Remove from scene
      this.scene.remove(this.particleSystem.getPoints())

      // Dispose GPU resources
      this.particleSystem.dispose()

      this.particleSystem = null

      console.log('Particle system destroyed')
    }
  }

  /**
   * Get current particle system instance
   * @returns {ParticleSystem|null} - Active particle system or null
   */
  getParticleSystem() {
    return this.particleSystem
  }

  /**
   * Update particle system (called from animation loop)
   * @param {number} delta - Time elapsed since last frame (seconds)
   * @param {Object|null} mousePosition - Mouse position in world coordinates
   */
  update(delta, mousePosition = null) {
    if (this.particleSystem) {
      this.particleSystem.update(delta, mousePosition)
    }
  }

  /**
   * Dispose all resources
   * Cleans up particle system and environment references
   */
  dispose() {
    this.destroyParticleSystem()
    this.availableEnvironments.clear()
    this.currentEnvironment = null

    console.log('EnvironmentManager disposed')
  }
}
