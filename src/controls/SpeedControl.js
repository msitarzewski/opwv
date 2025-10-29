// SpeedControl - Manages particle movement speed multiplier for productivity focus
// Handles smooth transitions, localStorage persistence, and state management

/**
 * SpeedControl class - Manages speed multiplier with smooth transitions
 *
 * Features:
 * - Speed range: 0.25x - 2.0x (default 1.0x)
 * - Smooth lerping transitions (0.3s duration)
 * - localStorage persistence across sessions
 * - Event callbacks for UI updates
 * - Preset speeds: 0.25x, 0.5x, 1.0x, 1.5x, 2.0x
 */
export class SpeedControl {
  /**
   * Create speed control system
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    // Speed configuration
    this.minSpeed = 0.25
    this.maxSpeed = 2.0
    this.defaultSpeed = 1.0
    this.lerpDuration = options.lerpDuration || 0.3 // seconds

    // Speed state
    this.targetSpeed = this.defaultSpeed
    this.currentSpeed = this.defaultSpeed
    this.isLerping = false
    this.lerpTimer = 0
    this.lerpStartSpeed = this.defaultSpeed

    // Preset speeds
    this.presets = {
      verySlow: 0.25,
      slow: 0.5,
      normal: 1.0,
      fast: 1.5,
      veryFast: 2.0
    }

    // Event callbacks
    this.onSpeedChange = null // Called when speed changes
    this.onLerpComplete = null // Called when lerp finishes

    // Load persisted speed from localStorage
    this.loadFromStorage()

    console.log(`SpeedControl initialized: ${this.currentSpeed}x`)
  }

  /**
   * Set target speed with smooth transition
   * @param {number} speed - Target speed multiplier (0.25 - 2.0)
   */
  setSpeed(speed) {
    // Clamp to valid range
    const clampedSpeed = Math.max(this.minSpeed, Math.min(this.maxSpeed, speed))

    if (clampedSpeed === this.targetSpeed) {
      return // No change needed
    }

    // Start lerping from current speed to target
    this.lerpStartSpeed = this.currentSpeed
    this.targetSpeed = clampedSpeed
    this.isLerping = true
    this.lerpTimer = 0

    // Persist to localStorage
    this.saveToStorage()

    console.log(`Speed changing: ${this.currentSpeed.toFixed(2)}x → ${this.targetSpeed.toFixed(2)}x`)
  }

  /**
   * Set speed using preset name
   * @param {string} presetName - Preset name (verySlow, slow, normal, fast, veryFast)
   */
  setPreset(presetName) {
    if (this.presets[presetName] !== undefined) {
      this.setSpeed(this.presets[presetName])
    } else {
      console.warn(`Unknown preset: ${presetName}`)
    }
  }

  /**
   * Get current speed multiplier (lerped value)
   * @returns {number} Current speed multiplier
   */
  getCurrentSpeed() {
    return this.currentSpeed
  }

  /**
   * Get target speed (final speed after lerp completes)
   * @returns {number} Target speed multiplier
   */
  getTargetSpeed() {
    return this.targetSpeed
  }

  /**
   * Check if speed is currently transitioning
   * @returns {boolean} True if lerping
   */
  isTransitioning() {
    return this.isLerping
  }

  /**
   * Update speed lerping (call from animation loop)
   * @param {number} delta - Time elapsed since last frame (seconds)
   */
  update(delta) {
    if (!this.isLerping) {
      return // No transition in progress
    }

    // Increment lerp timer
    this.lerpTimer += delta

    // Calculate lerp progress (0-1)
    const t = Math.min(1.0, this.lerpTimer / this.lerpDuration)

    // Ease-in-out curve for natural feel
    const easedT = t < 0.5
      ? 2 * t * t
      : 1 - Math.pow(-2 * t + 2, 2) / 2

    // Lerp from start to target
    this.currentSpeed = this.lerpStartSpeed + (this.targetSpeed - this.lerpStartSpeed) * easedT

    // Notify speed change
    if (this.onSpeedChange) {
      this.onSpeedChange(this.currentSpeed, this.targetSpeed)
    }

    // Check if lerp complete
    if (t >= 1.0) {
      this.currentSpeed = this.targetSpeed
      this.isLerping = false
      this.lerpTimer = 0

      if (this.onLerpComplete) {
        this.onLerpComplete(this.currentSpeed)
      }

      console.log(`Speed transition complete: ${this.currentSpeed.toFixed(2)}x`)
    }
  }

  /**
   * Load speed from localStorage
   */
  loadFromStorage() {
    try {
      const stored = localStorage.getItem('opwv_speed_multiplier')
      if (stored !== null) {
        const speed = parseFloat(stored)
        if (!isNaN(speed) && speed >= this.minSpeed && speed <= this.maxSpeed) {
          this.currentSpeed = speed
          this.targetSpeed = speed
          console.log(`Speed loaded from localStorage: ${speed}x`)
        }
      }
    } catch (error) {
      console.warn('Failed to load speed from localStorage:', error)
    }
  }

  /**
   * Save speed to localStorage
   */
  saveToStorage() {
    try {
      localStorage.setItem('opwv_speed_multiplier', this.targetSpeed.toString())
    } catch (error) {
      console.warn('Failed to save speed to localStorage:', error)
    }
  }

  /**
   * Reset speed to default (1.0x)
   */
  reset() {
    this.setSpeed(this.defaultSpeed)
  }

  /**
   * Get preset speeds for UI
   * @returns {Object} Preset speeds
   */
  getPresets() {
    return { ...this.presets }
  }
}
