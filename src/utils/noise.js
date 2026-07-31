// Noise utilities using simplex-noise for organic motion
import { createNoise3D } from 'simplex-noise'

/**
 * NoiseField provides 3D simplex noise for organic particle motion
 */
export class NoiseField {
  /**
   * Create a noise field with configurable parameters
   * @param {number} scale - Noise coordinate scale (smaller = larger features)
   * @param {number} strength - Noise output multiplier
   * @param {Function} random - Random source for deterministic simplex permutation
   */
  constructor(scale = 0.5, strength = 0.3, random = Math.random) {
    if (!Number.isFinite(scale) || scale < 0) {
      throw new RangeError('NoiseField scale must be a non-negative finite number')
    }
    if (!Number.isFinite(strength) || strength < 0) {
      throw new RangeError('NoiseField strength must be a non-negative finite number')
    }
    if (typeof random !== 'function') {
      throw new TypeError('NoiseField random source must be a function')
    }
    this.noise3D = createNoise3D(random)
    this.scale = scale
    this.strength = strength
  }

  /**
   * Get 2D noise value at position and time
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} time - Time offset for animation
   * @returns {Object} - {x, y} noise vector
   */
  get(x, y, time, target = null) {
    // Sample noise at scaled coordinates
    // Use time as Z dimension for temporal variation
    const noiseX = this.noise3D(
      x * this.scale,
      y * this.scale,
      time * this.scale
    )

    // Offset Y sampling to get independent noise
    const noiseY = this.noise3D(
      x * this.scale + 1000, // Offset to decorrelate from X
      y * this.scale + 1000,
      time * this.scale
    )

    // Return scaled noise vector
    const output = target || {}
    output.x = noiseX * this.strength
    output.y = noiseY * this.strength
    return output
  }

  /**
   * Get 3D noise value at position and time
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   * @param {number} time - Time offset for animation
   * @returns {Object} - {x, y, z} noise vector
   */
  get3D(x, y, z, time, target = null) {
    // Sample noise at scaled coordinates for each axis
    // Use time as additional dimension for temporal variation
    const noiseX = this.noise3D(
      x * this.scale,
      y * this.scale,
      z * this.scale + time * this.scale
    )

    // Offset sampling to get independent noise for Y
    const noiseY = this.noise3D(
      x * this.scale + 1000, // Offset to decorrelate from X
      y * this.scale + 1000,
      z * this.scale + time * this.scale
    )

    // Offset sampling to get independent noise for Z
    const noiseZ = this.noise3D(
      x * this.scale + 2000, // Offset to decorrelate from X and Y
      y * this.scale + 2000,
      z * this.scale + time * this.scale
    )

    // Return scaled noise vector
    const output = target || {}
    output.x = noiseX * this.strength
    output.y = noiseY * this.strength
    output.z = noiseZ * this.strength
    return output
  }
}
