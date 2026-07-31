// Performance monitoring and adaptive quality system
// Tracks FPS and automatically reduces particle count to maintain 60fps target

/**
 * PerformanceMonitor - FPS tracking and adaptive quality control
 * Monitors average FPS over N frames and triggers quality reductions when needed
 */
export class PerformanceMonitor {
  /**
   * Create a performance monitor
   * @param {Object} config - Configuration options
   * @param {number} config.checkInterval - Frames between checks (default: 60)
   * @param {number} config.targetFPS - Target frame rate (default: 60)
   * @param {number} config.minFPS - Minimum acceptable FPS before quality reduction (default: 50)
   */
  constructor(config = {}) {
    this.checkInterval = positiveInteger(config.checkInterval, 120, 'checkInterval')
    this.targetFPS = positiveFinite(config.targetFPS, 60, 'targetFPS')
    this.minFPS = positiveFinite(config.minFPS, 50, 'minFPS')
    this.longFrameMs = positiveFinite(config.longFrameMs, 50, 'longFrameMs')
    this.degradeChecks = positiveInteger(config.degradeChecks, 2, 'degradeChecks')
    this.recoverChecks = positiveInteger(config.recoverChecks, 4, 'recoverChecks')
    this.cooldownChecks = nonNegativeInteger(config.cooldownChecks, 3, 'cooldownChecks')

    if (this.minFPS > this.targetFPS) {
      throw new RangeError('minFPS must be no greater than targetFPS')
    }

    // FPS tracking
    this.fpsHistory = []
    this.frameTimes = []
    this.frameCount = 0
    this.lastTimestamp = null
    this.slowCheckCount = 0
    this.fastCheckCount = 0
    this.cooldownRemaining = 0
  }

  /**
   * Record a frame using requestAnimationFrame timestamp
   * @param {number} timestamp - High-resolution timestamp from RAF
   */
  recordFrame(timestamp) {
    if (!Number.isFinite(timestamp)) {
      return false
    }

    if (this.lastTimestamp !== null) {
      const deltaMs = timestamp - this.lastTimestamp
      if (deltaMs <= 0) {
        return false
      }
      if (Number.isFinite(deltaMs) && deltaMs > 0 && deltaMs < 1000) {
        const fps = 1000 / deltaMs
        this.fpsHistory.push(fps)
        this.frameTimes.push(deltaMs)
      }
    }

    this.lastTimestamp = timestamp
    this.frameCount++
    return true
  }

  /**
   * Check if enough frames collected for performance check
   * @returns {boolean} - True if should check performance now
   */
  shouldCheck() {
    return this.frameCount >= this.checkInterval
  }

  /**
   * Calculate average FPS over collected frames
   * @returns {number} - Average FPS
   */
  getAverageFPS() {
    if (this.fpsHistory.length === 0) {
      return this.targetFPS
    }

    const sum = this.fpsHistory.reduce((a, b) => a + b, 0)
    return sum / this.fpsHistory.length
  }

  getPercentileFrameTime(percentile) {
    if (!Number.isFinite(percentile) || percentile < 0 || percentile > 100) {
      throw new RangeError('percentile must be between 0 and 100')
    }
    if (this.frameTimes.length === 0) {
      return 1000 / this.targetFPS
    }

    const sorted = [...this.frameTimes].sort((a, b) => a - b)
    const index = Math.min(
      sorted.length - 1,
      Math.max(0, Math.ceil((percentile / 100) * sorted.length) - 1)
    )
    return sorted[index]
  }

  getMetrics() {
    const p50FrameTime = this.getPercentileFrameTime(50)
    const p95FrameTime = this.getPercentileFrameTime(95)
    const p99FrameTime = this.getPercentileFrameTime(99)

    return {
      averageFPS: this.getAverageFPS(),
      p50FrameTime,
      p95FrameTime,
      p99FrameTime,
      p95FPS: 1000 / p95FrameTime,
      longFrames: this.frameTimes.filter(frameTime => frameTime > this.longFrameMs).length,
      sampleCount: this.frameTimes.length
    }
  }

  setTargets({ targetFPS, minFPS }) {
    if (!Number.isFinite(targetFPS) || targetFPS <= 0) {
      throw new TypeError('targetFPS must be a positive finite number')
    }
    if (!Number.isFinite(minFPS) || minFPS <= 0 || minFPS > targetFPS) {
      throw new TypeError('minFPS must be positive and no greater than targetFPS')
    }

    this.targetFPS = targetFPS
    this.minFPS = minFPS
    this.reset({ resetAdaptiveState: true })
  }

  /**
   * Check if quality reduction needed based on average FPS
   * @returns {boolean} - True if average FPS below minimum threshold
   */
  shouldReduceQuality() {
    return this.getMetrics().p95FPS < this.minFPS
  }

  shouldIncreaseQuality() {
    return this.getMetrics().p95FPS >= this.targetFPS * 0.98
  }

  evaluateQuality() {
    const slow = this.shouldReduceQuality()
    const fast = !slow && this.shouldIncreaseQuality()

    this.slowCheckCount = slow ? this.slowCheckCount + 1 : 0
    this.fastCheckCount = fast ? this.fastCheckCount + 1 : 0

    if (this.cooldownRemaining > 0) {
      this.cooldownRemaining--
      return null
    }

    if (this.slowCheckCount >= this.degradeChecks) {
      this.markQualityChanged()
      return 'reduce'
    }

    if (this.fastCheckCount >= this.recoverChecks) {
      this.markQualityChanged()
      return 'increase'
    }

    return null
  }

  markQualityChanged() {
    this.slowCheckCount = 0
    this.fastCheckCount = 0
    this.cooldownRemaining = this.cooldownChecks
  }

  /**
   * Reset tracking state after performance check
   */
  reset({ resetTimestamp = false, resetAdaptiveState = false } = {}) {
    this.fpsHistory = []
    this.frameTimes = []
    this.frameCount = 0
    if (resetTimestamp) {
      this.lastTimestamp = null
    }
    if (resetAdaptiveState) {
      this.slowCheckCount = 0
      this.fastCheckCount = 0
      this.cooldownRemaining = 0
    }
  }
}

function positiveFinite(value, fallback, name) {
  if (value === undefined) return fallback
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive finite number`)
  }
  return value
}

function positiveInteger(value, fallback, name) {
  if (value === undefined) return fallback
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive integer`)
  }
  return value
}

function nonNegativeInteger(value, fallback, name) {
  if (value === undefined) return fallback
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative integer`)
  }
  return value
}
