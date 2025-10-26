// Seeded random number generation for reproducible visuals
// Uses mulberry32 PRNG algorithm

/**
 * SeededRandom - Reproducible random number generator
 * Uses mulberry32 algorithm for fast, high-quality pseudorandom numbers
 */
export class SeededRandom {
  /**
   * Create a seeded random number generator
   * @param {number} seed - 32-bit integer seed
   */
  constructor(seed) {
    this.seed = seed >>> 0 // Ensure unsigned 32-bit integer
    this.state = this.seed
  }

  /**
   * Generate next random number [0, 1) using mulberry32
   * @returns {number} - Random float in range [0, 1)
   */
  random() {
    let t = (this.state += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  /**
   * Generate random integer in range [min, max) (exclusive max)
   * @param {number} min - Minimum value (inclusive)
   * @param {number} max - Maximum value (exclusive)
   * @returns {number} - Random integer
   */
  randomInt(min, max) {
    return Math.floor(this.random() * (max - min)) + min
  }

  /**
   * Generate random float in range [min, max)
   * @param {number} min - Minimum value (inclusive)
   * @param {number} max - Maximum value (exclusive)
   * @returns {number} - Random float
   */
  randomFloat(min, max) {
    return this.random() * (max - min) + min
  }

  /**
   * Get current seed value
   * @returns {number} - The seed used to initialize this RNG
   */
  getSeed() {
    return this.seed
  }
}

/**
 * Parse seed from URL parameters
 * @returns {number|null} - Seed from ?seed=12345 or null if not present
 */
export function getSeedFromURL() {
  const params = new URLSearchParams(window.location.search)
  const seedParam = params.get('seed')

  if (seedParam) {
    const seed = parseInt(seedParam, 10)
    if (!isNaN(seed)) {
      return seed
    }
  }

  return null
}

/**
 * Generate a random seed from current timestamp
 * @returns {number} - 32-bit seed based on Date.now()
 */
export function generateSeed() {
  return Date.now() >>> 0 // Unsigned 32-bit integer
}
