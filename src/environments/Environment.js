// Environment configuration schema and validation
// Defines spatial layout, behavior parameters, visual aesthetics, and performance targets

/**
 * Environment class - Configuration wrapper for spatial particle environments
 *
 * Encapsulates all parameters needed to define a unique particle environment:
 * - Spatial configuration (type, particle count, bounds, initialization)
 * - Behavior parameters (flocking weights, noise, speed)
 * - Visual aesthetics (colors, size, opacity)
 * - Performance targets (FPS, adaptive quality)
 */
export class Environment {
  /**
   * Create an environment from configuration object
   * @param {Object} config - Environment configuration
   * @param {string} config.id - Unique identifier (e.g., 'sphere', 'nebula')
   * @param {string} config.name - Display name (e.g., 'Sphere', 'Nebula Cloud')
   * @param {string} config.description - User-facing description
   * @param {Object} config.spatial - Spatial configuration
   * @param {string} config.spatial.type - 'spherical' | 'planar' | 'lattice' | 'vortex' | 'custom'
   * @param {number} config.spatial.particleCount - Number of particles (500-1000 range)
   * @param {Object} config.spatial.bounds - Type-specific bounds object
   * @param {Function|null} config.spatial.initializationFn - Optional custom initialization function
   * @param {Object} config.behavior - Behavior parameters
   * @param {number} config.behavior.cohesionRadius - Cohesion behavior radius
   * @param {number} config.behavior.cohesionWeight - Cohesion force multiplier
   * @param {number} config.behavior.alignmentRadius - Alignment behavior radius
   * @param {number} config.behavior.alignmentWeight - Alignment force multiplier
   * @param {number} config.behavior.separationRadius - Separation behavior radius
   * @param {number} config.behavior.separationWeight - Separation force multiplier
   * @param {number} config.behavior.maxSpeed - Maximum particle velocity
   * @param {number} config.behavior.noiseScale - Noise field scale parameter
   * @param {number} config.behavior.noiseStrength - Noise field strength parameter
   * @param {Object} config.visual - Visual aesthetics
   * @param {string[]|null} config.visual.colorPalette - Hex color strings or null for generatePalette
   * @param {number} config.visual.particleSize - Base particle size in pixels
   * @param {number} config.visual.opacity - Particle opacity (0.0-1.0)
   * @param {boolean} config.visual.sizeAttenuation - Distance-based size scaling
   * @param {Object} config.performance - Performance targets
   * @param {number} config.performance.targetFPS - Target frame rate
   * @param {number} config.performance.minFPS - Minimum acceptable frame rate
   * @param {boolean} config.performance.adaptiveQuality - Enable adaptive quality reduction
   */
  constructor(config) {
    // Core metadata
    this.id = config.id
    this.name = config.name
    this.description = config.description

    // Spatial configuration
    this.spatial = {
      type: config.spatial.type,
      particleCount: config.spatial.particleCount,
      bounds: { ...config.spatial.bounds },
      initializationFn: config.spatial.initializationFn || null,
      wrapMode: config.spatial.wrapMode || (config.spatial.type === 'spherical' ? 'spherical' : 'none')
    }

    // Behavior parameters
    this.behavior = {
      mode: config.behavior.mode || 'flocking', // 'flocking' | 'orbital' | 'spring' | 'wave' | 'flow' | 'rotation' | 'brownian'

      // Flocking parameters (mode: 'flocking')
      cohesionRadius: config.behavior.cohesionRadius,
      cohesionWeight: config.behavior.cohesionWeight,
      alignmentRadius: config.behavior.alignmentRadius,
      alignmentWeight: config.behavior.alignmentWeight,
      separationRadius: config.behavior.separationRadius,
      separationWeight: config.behavior.separationWeight,
      maxSpeed: config.behavior.maxSpeed,
      noiseScale: config.behavior.noiseScale,
      noiseStrength: config.behavior.noiseStrength,

      // Mode-specific parameters (optional, mode-dependent)
      modeParams: config.behavior.modeParams || {},
      interactionStrength: config.behavior.interactionStrength ?? 1,
      interactionRadius: config.behavior.interactionRadius ?? 4,
      interactionMaxSpeed: config.behavior.interactionMaxSpeed ?? 12
    }

    // Visual aesthetics
    this.visual = {
      ...config.visual,
      renderMode: config.visual.renderMode || 'soft',
      colorPalette: config.visual.colorPalette ?? null,
      particleSize: config.visual.particleSize,
      opacity: config.visual.opacity,
      sizeAttenuation: config.visual.sizeAttenuation,

      // Render mode specific parameters
      emissive: config.visual.emissive ?? null,
      emissiveIntensity: config.visual.emissiveIntensity ?? 0.5
    }

    // Performance targets
    this.performance = {
      targetFPS: config.performance.targetFPS,
      minFPS: config.performance.minFPS,
      adaptiveQuality: config.performance.adaptiveQuality
    }

    // Validate configuration
    this.validate()
  }

  /**
   * Validate environment configuration
   * @throws {Error} If configuration is invalid
   */
  validate() {
    // Core metadata validation
    if (!this.id || typeof this.id !== 'string') {
      throw new Error('Environment.id must be a non-empty string')
    }
    if (!this.name || typeof this.name !== 'string') {
      throw new Error('Environment.name must be a non-empty string')
    }
    if (!this.description || typeof this.description !== 'string') {
      throw new Error('Environment.description must be a non-empty string')
    }

    // Spatial validation
    const validTypes = ['spherical', 'planar', 'lattice', 'vortex', 'custom']
    if (!validTypes.includes(this.spatial.type)) {
      throw new Error(`Environment.spatial.type must be one of: ${validTypes.join(', ')}`)
    }
    if (!Number.isInteger(this.spatial.particleCount) || this.spatial.particleCount < 1) {
      throw new Error('Environment.spatial.particleCount must be a positive integer')
    }
    if (this.spatial.particleCount > 65535) {
      throw new Error('Environment.spatial.particleCount cannot exceed 65535')
    }
    if (!this.spatial.bounds || typeof this.spatial.bounds !== 'object') {
      throw new Error('Environment.spatial.bounds must be an object')
    }
    if (this.spatial.initializationFn !== null &&
        typeof this.spatial.initializationFn !== 'function') {
      throw new Error('Environment.spatial.initializationFn must be a function or null')
    }
    if (this.spatial.type !== 'spherical' && !this.spatial.initializationFn) {
      throw new Error(`Environment.spatial.type '${this.spatial.type}' requires initializationFn`)
    }
    const validWrapModes = ['none', 'spherical']
    if (!validWrapModes.includes(this.spatial.wrapMode)) {
      throw new Error(`Environment.spatial.wrapMode must be one of: ${validWrapModes.join(', ')}`)
    }
    if (this.spatial.wrapMode === 'spherical') {
      const { innerRadius, outerRadius } = this.spatial.bounds
      if (!Number.isFinite(innerRadius) || !Number.isFinite(outerRadius) ||
          innerRadius < 0 || outerRadius <= innerRadius) {
        throw new Error('Spherical bounds require 0 <= innerRadius < outerRadius')
      }
    }

    const validBehaviorModes = ['flocking', 'orbital', 'spring', 'wave', 'flow', 'rotation', 'brownian']
    if (!validBehaviorModes.includes(this.behavior.mode)) {
      throw new Error(`Environment.behavior.mode must be one of: ${validBehaviorModes.join(', ')}`)
    }

    // Behavior validation (check all required numeric parameters)
    const behaviorParams = [
      'cohesionRadius', 'cohesionWeight', 'alignmentRadius', 'alignmentWeight',
      'separationRadius', 'separationWeight', 'maxSpeed', 'noiseScale', 'noiseStrength'
    ]
    for (const param of behaviorParams) {
      if (!Number.isFinite(this.behavior[param])) {
        throw new Error(`Environment.behavior.${param} must be a number`)
      }
    }
    const nonNegativeBehaviorParams = [
      'cohesionRadius', 'cohesionWeight', 'alignmentRadius', 'alignmentWeight',
      'separationRadius', 'separationWeight', 'maxSpeed', 'noiseScale',
      'noiseStrength', 'interactionStrength', 'interactionRadius', 'interactionMaxSpeed'
    ]
    for (const param of nonNegativeBehaviorParams) {
      if (!Number.isFinite(this.behavior[param]) || this.behavior[param] < 0) {
        throw new Error(`Environment.behavior.${param} must be a non-negative number`)
      }
    }
    if (!this.behavior.modeParams || typeof this.behavior.modeParams !== 'object') {
      throw new Error('Environment.behavior.modeParams must be an object')
    }

    // Visual validation
    if (this.visual.colorPalette !== null && !Array.isArray(this.visual.colorPalette)) {
      throw new Error('Environment.visual.colorPalette must be an array or null')
    }
    if (!Number.isFinite(this.visual.particleSize) || this.visual.particleSize <= 0) {
      throw new Error('Environment.visual.particleSize must be a positive number')
    }
    if (!Number.isFinite(this.visual.opacity) || this.visual.opacity < 0 || this.visual.opacity > 1) {
      throw new Error('Environment.visual.opacity must be a number between 0 and 1')
    }
    if (typeof this.visual.sizeAttenuation !== 'boolean') {
      throw new Error('Environment.visual.sizeAttenuation must be a boolean')
    }
    const validRenderModes = ['soft', 'glow', 'stars', 'lattice', 'trails', 'surface', 'hypercube']
    if (!validRenderModes.includes(this.visual.renderMode)) {
      throw new Error(`Environment.visual.renderMode must be one of: ${validRenderModes.join(', ')}`)
    }
    if (this.visual.colorPalette && this.visual.colorPalette.length === 0) {
      throw new Error('Environment.visual.colorPalette cannot be empty')
    }
    if (this.visual.pointScale !== undefined &&
        (!Number.isFinite(this.visual.pointScale) || this.visual.pointScale <= 0)) {
      throw new Error('Environment.visual.pointScale must be a positive number')
    }
    if (!Number.isFinite(this.visual.emissiveIntensity) ||
        this.visual.emissiveIntensity < 0) {
      throw new Error('Environment.visual.emissiveIntensity must be a non-negative number')
    }

    // Performance validation
    if (!Number.isFinite(this.performance.targetFPS) || this.performance.targetFPS <= 0) {
      throw new Error('Environment.performance.targetFPS must be a positive number')
    }
    if (!Number.isFinite(this.performance.minFPS) || this.performance.minFPS <= 0) {
      throw new Error('Environment.performance.minFPS must be a positive number')
    }
    if (typeof this.performance.adaptiveQuality !== 'boolean') {
      throw new Error('Environment.performance.adaptiveQuality must be a boolean')
    }
    if (this.performance.minFPS > this.performance.targetFPS) {
      throw new Error('Environment.performance.minFPS cannot exceed targetFPS')
    }
  }

  /**
   * Create a deep copy of this environment
   * @returns {Environment} - Cloned environment instance
   */
  clone() {
    return new Environment({
      id: this.id,
      name: this.name,
      description: this.description,
      spatial: {
        type: this.spatial.type,
        particleCount: this.spatial.particleCount,
        bounds: { ...this.spatial.bounds },
        initializationFn: this.spatial.initializationFn,
        wrapMode: this.spatial.wrapMode
      },
      behavior: {
        ...this.behavior,
        modeParams: this.cloneValue(this.behavior.modeParams)
      },
      visual: {
        ...this.visual,
        colorPalette: this.visual.colorPalette ? [...this.visual.colorPalette] : null
      },
      performance: { ...this.performance }
    })
  }

  /**
   * Serialize environment to JSON
   * @returns {Object} - JSON-serializable configuration object
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      spatial: {
        type: this.spatial.type,
        particleCount: this.spatial.particleCount,
        bounds: this.spatial.bounds,
        wrapMode: this.spatial.wrapMode,
        initializationFn: this.spatial.initializationFn ? '[Function]' : null
      },
      behavior: this.behavior,
      visual: this.visual,
      performance: this.performance
    }
  }

  cloneValue(value) {
    if (value === null || typeof value !== 'object') return value
    if (typeof value.clone === 'function') return value.clone()
    if (Array.isArray(value)) return value.map(item => this.cloneValue(item))

    const clone = {}
    for (const [key, item] of Object.entries(value)) {
      clone[key] = this.cloneValue(item)
    }
    return clone
  }
}
