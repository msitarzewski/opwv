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
    this.checkInterval = config.checkInterval || 60  // frames
    this.targetFPS = config.targetFPS || 60
    this.minFPS = config.minFPS || 50

    // FPS tracking
    this.fpsHistory = []
    this.frameCount = 0
    this.lastTimestamp = null
  }

  /**
   * Record a frame using requestAnimationFrame timestamp
   * @param {number} timestamp - High-resolution timestamp from RAF
   */
  recordFrame(timestamp) {
    if (this.lastTimestamp !== null) {
      const deltaMs = timestamp - this.lastTimestamp
      const fps = 1000 / deltaMs
      this.fpsHistory.push(fps)
    }

    this.lastTimestamp = timestamp
    this.frameCount++
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

  /**
   * Check if quality reduction needed based on average FPS
   * @returns {boolean} - True if average FPS below minimum threshold
   */
  shouldReduceQuality() {
    return this.getAverageFPS() < this.minFPS
  }

  /**
   * Reset tracking state after performance check
   */
  reset() {
    this.fpsHistory = []
    this.frameCount = 0
    // Keep lastTimestamp for continuous FPS calculation
  }
}
