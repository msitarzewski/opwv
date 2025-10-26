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
   */
  constructor(scale = 0.5, strength = 0.3) {
    this.noise3D = createNoise3D()
    this.scale = scale
    this.strength = strength
  }

  /**
   * Get 3D noise value at position and time
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} time - Time offset for animation
   * @returns {Object} - {x, y} noise vector
   */
  get(x, y, time) {
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
    return {
      x: noiseX * this.strength,
      y: noiseY * this.strength
    }
  }
}
