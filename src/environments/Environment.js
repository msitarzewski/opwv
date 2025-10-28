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
      bounds: config.spatial.bounds,
      initializationFn: config.spatial.initializationFn || null
    }

    // Behavior parameters (flocking + noise)
    this.behavior = {
      cohesionRadius: config.behavior.cohesionRadius,
      cohesionWeight: config.behavior.cohesionWeight,
      alignmentRadius: config.behavior.alignmentRadius,
      alignmentWeight: config.behavior.alignmentWeight,
      separationRadius: config.behavior.separationRadius,
      separationWeight: config.behavior.separationWeight,
      maxSpeed: config.behavior.maxSpeed,
      noiseScale: config.behavior.noiseScale,
      noiseStrength: config.behavior.noiseStrength
    }

    // Visual aesthetics
    this.visual = {
      colorPalette: config.visual.colorPalette || null,
      particleSize: config.visual.particleSize,
      opacity: config.visual.opacity,
      sizeAttenuation: config.visual.sizeAttenuation
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
    if (typeof this.spatial.particleCount !== 'number' || this.spatial.particleCount < 1) {
      throw new Error('Environment.spatial.particleCount must be a positive number')
    }
    if (!this.spatial.bounds || typeof this.spatial.bounds !== 'object') {
      throw new Error('Environment.spatial.bounds must be an object')
    }

    // Behavior validation (check all required numeric parameters)
    const behaviorParams = [
      'cohesionRadius', 'cohesionWeight', 'alignmentRadius', 'alignmentWeight',
      'separationRadius', 'separationWeight', 'maxSpeed', 'noiseScale', 'noiseStrength'
    ]
    for (const param of behaviorParams) {
      if (typeof this.behavior[param] !== 'number') {
        throw new Error(`Environment.behavior.${param} must be a number`)
      }
    }

    // Visual validation
    if (this.visual.colorPalette !== null && !Array.isArray(this.visual.colorPalette)) {
      throw new Error('Environment.visual.colorPalette must be an array or null')
    }
    if (typeof this.visual.particleSize !== 'number' || this.visual.particleSize <= 0) {
      throw new Error('Environment.visual.particleSize must be a positive number')
    }
    if (typeof this.visual.opacity !== 'number' || this.visual.opacity < 0 || this.visual.opacity > 1) {
      throw new Error('Environment.visual.opacity must be a number between 0 and 1')
    }
    if (typeof this.visual.sizeAttenuation !== 'boolean') {
      throw new Error('Environment.visual.sizeAttenuation must be a boolean')
    }

    // Performance validation
    if (typeof this.performance.targetFPS !== 'number' || this.performance.targetFPS <= 0) {
      throw new Error('Environment.performance.targetFPS must be a positive number')
    }
    if (typeof this.performance.minFPS !== 'number' || this.performance.minFPS <= 0) {
      throw new Error('Environment.performance.minFPS must be a positive number')
    }
    if (typeof this.performance.adaptiveQuality !== 'boolean') {
      throw new Error('Environment.performance.adaptiveQuality must be a boolean')
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
        initializationFn: this.spatial.initializationFn
      },
      behavior: { ...this.behavior },
      visual: {
        colorPalette: this.visual.colorPalette ? [...this.visual.colorPalette] : null,
        particleSize: this.visual.particleSize,
        opacity: this.visual.opacity,
        sizeAttenuation: this.visual.sizeAttenuation
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
        initializationFn: this.spatial.initializationFn ? '[Function]' : null
      },
      behavior: this.behavior,
      visual: this.visual,
      performance: this.performance
    }
  }
}
