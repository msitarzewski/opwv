// Environment manager - Orchestrates multiple spatial environments
// Handles loading, switching, and particle system coordination

import { ParticleSystem } from '../particles/ParticleSystem.js'
import { Environment } from './Environment.js'
import * as THREE from 'three'

const PRESET_LOADERS = Object.freeze({
  sphere: () => import('./presets/sphere.js'),
  nebula: () => import('./presets/nebula.js'),
  galaxy: () => import('./presets/galaxy.js'),
  lattice: () => import('./presets/lattice.js'),
  vortex: () => import('./presets/vortex.js'),
  ocean: () => import('./presets/ocean.js'),
  hypercube: () => import('./presets/hypercube.js')
})

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
   * @param {SpeedControl} speedControl - Optional speed control instance
   */
  constructor(scene, camera, renderer, rng, speedControl = null) {
    this.scene = scene
    this.camera = camera
    this.renderer = renderer
    this.rng = rng
    this.speedControl = speedControl

    // Environment state
    this.availableEnvironments = new Map() // presetId -> Environment
    this.loadingPresets = new Map()
    this.currentEnvironment = null
    this.particleSystem = null
    this.disposed = false

    // Comfortable fade transition state
    this.transitionState = 'idle'
    this.transitionElapsed = 0
    this.transitionDuration = 0.35
    this.activeTransition = null
    this.queuedTransition = null
    this.onEnvironmentChange = null
    this.onTransitionChange = null

    this.fadeMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0,
      side: THREE.BackSide,
      depthTest: false,
      depthWrite: false
    })
    this.fadeMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 16, 12),
      this.fadeMaterial
    )
    this.fadeMesh.visible = false
    this.fadeMesh.renderOrder = 10000
    this.scene.add(this.fadeMesh)
  }

  /**
   * Load an environment preset by ID
   * @param {string} presetId - Preset identifier (e.g., 'sphere', 'nebula')
   * @returns {Promise<Environment>} - Loaded environment instance
   * @throws {Error} If preset cannot be loaded
   */
  async loadPreset(presetId) {
    if (this.disposed) {
      throw new Error('EnvironmentManager has been disposed')
    }

    if (!Object.hasOwn(PRESET_LOADERS, presetId)) {
      throw new Error(`Unknown environment preset '${String(presetId)}'`)
    }
    const loader = PRESET_LOADERS[presetId]

    if (this.availableEnvironments.has(presetId)) {
      return this.availableEnvironments.get(presetId)
    }

    if (this.loadingPresets.has(presetId)) {
      return this.loadingPresets.get(presetId)
    }

    const loadPromise = (async () => {
      try {
        const presetModule = await loader()
        if (this.disposed) {
          throw new Error('EnvironmentManager was disposed while loading a preset')
        }
        const presetConfig = presetModule.default

        // Create Environment instance from preset config
        const environment = new Environment(presetConfig)

        // Store in available environments
        this.availableEnvironments.set(presetId, environment)

        console.log(`Environment preset loaded: ${presetId} (${environment.name})`)

        return environment
      } catch (error) {
        console.error(`Failed to load environment preset: ${presetId}`, error)
        throw new Error(`Environment preset '${presetId}' not found or invalid`, { cause: error })
      } finally {
        this.loadingPresets.delete(presetId)
      }
    })()

    this.loadingPresets.set(presetId, loadPromise)
    return loadPromise
  }

  assertUsable() {
    if (this.disposed) {
      throw new Error('EnvironmentManager has been disposed')
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
  async switchEnvironment(presetId, options = {}) {
    this.assertUsable()

    // Check if preset is loaded
    if (!this.availableEnvironments.has(presetId)) {
      // Attempt to load preset if not already available
      await this.loadPreset(presetId)
    }

    const newEnvironment = this.availableEnvironments.get(presetId)

    if (!newEnvironment) {
      throw new Error(`Environment '${presetId}' could not be loaded`)
    }

    if (this.currentEnvironment?.id === presetId && this.transitionState === 'idle') {
      return false
    }

    if (!this.currentEnvironment || options.immediate) {
      if (this.transitionState !== 'idle' || this.queuedTransition) {
        this.cancelTransition()
      }
      this.activateEnvironment(newEnvironment)
      return true
    }

    if (this.transitionState !== 'idle') {
      return this.queueEnvironmentSwitch(newEnvironment)
    }

    return this.beginTransition(newEnvironment)
  }

  beginTransition(environment) {
    return new Promise((resolve, reject) => {
      this.activeTransition = { environment, resolve, reject }
      this.transitionState = 'fadeOut'
      this.transitionElapsed = 0
      this.fadeMesh.visible = true
      this.fadeMaterial.opacity = 0
      this.onTransitionChange?.(this.getTransitionStatus())
    })
  }

  queueEnvironmentSwitch(environment) {
    if (this.queuedTransition) {
      this.queuedTransition.resolve(false)
    }

    return new Promise((resolve, reject) => {
      this.queuedTransition = { environment, resolve, reject }
    })
  }

  activateEnvironment(newEnvironment) {
    const environmentRng = this.rng?.derive
      ? this.rng.derive(newEnvironment.id)
      : this.rng
    const nextParticleSystem = new ParticleSystem(newEnvironment, null, environmentRng)
    const previousParticleSystem = this.particleSystem

    this.scene.add(nextParticleSystem.getPoints())
    this.particleSystem = nextParticleSystem
    this.currentEnvironment = newEnvironment

    if (previousParticleSystem) {
      this.scene.remove(previousParticleSystem.getPoints())
      previousParticleSystem.dispose()
    }

    this.onEnvironmentChange?.(newEnvironment)

    console.log(`Switched to environment: ${newEnvironment.id} (${newEnvironment.name})`)
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
    this.activateEnvironment(this.currentEnvironment)

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
    this.updateTransition(delta)

    if (this.particleSystem) {
      // Apply speed multiplier if speed control is available
      const adjustedDelta = this.speedControl
        ? delta * this.speedControl.getCurrentSpeed()
        : delta

      this.particleSystem.update(adjustedDelta, mousePosition)
    }
  }

  updateTransition(delta) {
    this.fadeMesh.position.copy(this.camera.position)

    if (this.transitionState === 'idle' || !this.activeTransition) {
      return
    }

    this.transitionElapsed += Math.max(0, Math.min(delta, 0.1))
    const progress = Math.min(1, this.transitionElapsed / this.transitionDuration)

    if (this.transitionState === 'fadeOut') {
      this.fadeMaterial.opacity = easeInOut(progress)

      if (progress >= 1) {
        try {
          this.activateEnvironment(this.activeTransition.environment)
          this.transitionState = 'fadeIn'
          this.transitionElapsed = 0
          this.onTransitionChange?.(this.getTransitionStatus())
        } catch (error) {
          this.failTransition(error)
        }
      }
      return
    }

    this.fadeMaterial.opacity = 1 - easeInOut(progress)
    if (progress >= 1) {
      this.completeTransition()
    }
  }

  completeTransition() {
    const completedTransition = this.activeTransition
    this.activeTransition = null
    this.transitionState = 'idle'
    this.transitionElapsed = 0
    this.fadeMaterial.opacity = 0
    this.fadeMesh.visible = false
    completedTransition?.resolve(true)
    this.onTransitionChange?.(this.getTransitionStatus())

    const queuedTransition = this.queuedTransition
    this.queuedTransition = null
    if (queuedTransition) {
      if (queuedTransition.environment.id === this.currentEnvironment?.id) {
        queuedTransition.resolve(false)
      } else {
        this.beginTransition(queuedTransition.environment)
          .then(queuedTransition.resolve, queuedTransition.reject)
      }
    }
  }

  failTransition(error) {
    const failedTransition = this.activeTransition
    this.activeTransition = null
    this.transitionState = 'idle'
    this.fadeMaterial.opacity = 0
    this.fadeMesh.visible = false
    failedTransition?.reject(error)
    if (this.queuedTransition) {
      this.queuedTransition.reject(error)
      this.queuedTransition = null
    }
    this.onTransitionChange?.(this.getTransitionStatus())
  }

  cancelTransition({ jumpToTarget = false } = {}) {
    let cancelled = false

    if (this.activeTransition && jumpToTarget) {
      try {
        this.activateEnvironment(this.activeTransition.environment)
      } catch (error) {
        this.failTransition(error)
        return false
      }
    }

    if (this.activeTransition) {
      const cancelledTransition = this.activeTransition
      this.activeTransition = null
      cancelledTransition.resolve(false)
      cancelled = true
    }

    if (this.queuedTransition) {
      this.queuedTransition.resolve(false)
      this.queuedTransition = null
      cancelled = true
    }

    if (cancelled) {
      this.transitionState = 'idle'
      this.transitionElapsed = 0
      this.fadeMaterial.opacity = 0
      this.fadeMesh.visible = false
      this.onTransitionChange?.(this.getTransitionStatus())
    }

    return cancelled
  }

  isTransitioning() {
    return this.transitionState !== 'idle'
  }

  getTransitionStatus() {
    return {
      state: this.transitionState,
      targetEnvironmentId: this.activeTransition?.environment.id || null,
      progress: this.transitionState === 'idle'
        ? 0
        : Math.min(1, this.transitionElapsed / this.transitionDuration)
    }
  }

  /**
   * Dispose all resources
   * Cleans up particle system and environment references
   */
  dispose() {
    if (this.disposed) return

    this.cancelTransition()
    this.disposed = true
    this.destroyParticleSystem()
    this.availableEnvironments.clear()
    this.loadingPresets.clear()
    this.currentEnvironment = null
    this.onEnvironmentChange = null
    this.onTransitionChange = null
    this.scene.remove(this.fadeMesh)
    this.fadeMesh.geometry.dispose()
    this.fadeMaterial.dispose()

    console.log('EnvironmentManager disposed')
  }
}

function easeInOut(value) {
  return value < 0.5
    ? 2 * value * value
    : 1 - Math.pow(-2 * value + 2, 2) / 2
}
