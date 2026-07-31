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
    assertSafeInteger(seed, 'Seed')
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
    if (!Number.isSafeInteger(min) || !Number.isSafeInteger(max) || max <= min) {
      throw new RangeError('randomInt requires safe integers with max greater than min')
    }
    return Math.floor(this.random() * (max - min)) + min
  }

  /**
   * Generate random float in range [min, max)
   * @param {number} min - Minimum value (inclusive)
   * @param {number} max - Maximum value (exclusive)
   * @returns {number} - Random float
   */
  randomFloat(min, max) {
    if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) {
      throw new RangeError('randomFloat requires finite bounds with max greater than min')
    }
    return this.random() * (max - min) + min
  }

  /**
   * Get current seed value
   * @returns {number} - The seed used to initialize this RNG
   */
  getSeed() {
    return this.seed
  }

  /**
   * Reset this generator to its initial or a supplied seed.
   * @param {number} seed - Unsigned 32-bit seed
   */
  reset(seed = this.seed) {
    assertSafeInteger(seed, 'Seed')
    this.seed = seed >>> 0
    this.state = this.seed
  }

  /**
   * Create an independent deterministic generator derived from this seed.
   * @param {string|number} namespace - Stable namespace such as an environment ID
   * @returns {SeededRandom}
   */
  derive(namespace) {
    return new SeededRandom(deriveSeed(this.seed, namespace))
  }
}

/**
 * Derive a stable 32-bit seed from a base seed and namespace using FNV-1a.
 * @param {number} baseSeed - Safe integer base seed
 * @param {string|number} namespace - Stable namespace
 * @returns {number}
 */
export function deriveSeed(baseSeed, namespace) {
  assertSafeInteger(baseSeed, 'Base seed')
  if (
    (typeof namespace !== 'string' && typeof namespace !== 'number') ||
    (typeof namespace === 'number' && !Number.isFinite(namespace))
  ) {
    throw new TypeError('Seed namespace must be a string or finite number')
  }

  const namespaceText = String(namespace)
  if (namespaceText.length === 0 || namespaceText.length > 128) {
    throw new RangeError('Seed namespace must contain between 1 and 128 characters')
  }

  const input = `${baseSeed >>> 0}:${namespaceText}`
  let hash = 0x811c9dc5

  for (let index = 0; index < input.length; index++) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }

  return hash >>> 0
}

/**
 * Parse seed from URL parameters
 * @returns {number|null} - Seed from ?seed=12345 or null if not present
 */
export function getSeedFromURL() {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  const seedParam = params.get('seed')

  if (!seedParam || seedParam.length > 10 || !/^\d+$/.test(seedParam)) {
    return null
  }

  const seed = Number(seedParam)
  return Number.isSafeInteger(seed) && seed >= 0 && seed <= 0xffffffff
    ? seed >>> 0
    : null
}

/**
 * Generate a random seed from current timestamp
 * @returns {number} - 32-bit seed based on Date.now()
 */
export function generateSeed() {
  return Date.now() >>> 0 // Unsigned 32-bit integer
}

function assertSafeInteger(value, label) {
  if (!Number.isSafeInteger(value)) {
    throw new TypeError(`${label} must be a safe integer`)
  }
}
