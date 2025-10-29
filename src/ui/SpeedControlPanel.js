// SpeedControlPanel - VR spatial UI for speed control with slider and preset buttons
// Canvas-based rendering following EnvironmentCard pattern

import * as THREE from 'three'

/**
 * SpeedControlPanel class - Speed control UI panel for VR
 *
 * Features:
 * - Horizontal slider with tick marks (0.25x, 0.5x, 1.0x, 1.5x, 2.0x)
 * - Four preset buttons: Slow (0.5x), Normal (1.0x), Fast (1.5x), Rapid (2.0x)
 * - Current speed display (e.g., "1.5x Speed")
 * - Glassmorphic design matching EnvironmentCard
 * - Canvas-based rendering for VR performance
 */
export class SpeedControlPanel {
  /**
   * Create speed control panel
   * @param {SpeedControl} speedControl - SpeedControl instance
   * @param {Object} options - Panel configuration options
   */
  constructor(speedControl, options = {}) {
    this.speedControl = speedControl

    // Panel dimensions (world units) - reduced size
    this.width = options.width || 2.5
    this.height = options.height || 0.8

    // Canvas resolution (pixels)
    this.canvasWidth = 640
    this.canvasHeight = Math.floor(640 * (this.height / this.width)) // 205px

    // Panel state
    this.isHovered = false
    this.hoveredSlider = false
    this.isDragging = false

    // Slider configuration - larger and more prominent
    this.sliderY = 120 // Y position from top (moved up since we removed title)
    this.sliderWidth = 540 // Slider track width
    this.sliderX = (this.canvasWidth - this.sliderWidth) / 2 // Center slider
    this.sliderHeight = 12 // Thicker track
    this.thumbRadius = 24 // Bigger thumb for easier grabbing

    // Tick marks for slider (just visual marks, no labels)
    this.ticks = [
      { value: 0.25 },
      { value: 0.5 },
      { value: 1.0 },
      { value: 1.5 },
      { value: 2.0 }
    ]

    // Create canvas for texture
    this.canvas = document.createElement('canvas')
    this.canvas.width = this.canvasWidth
    this.canvas.height = this.canvasHeight
    this.ctx = this.canvas.getContext('2d')

    // Create Three.js mesh
    this.mesh = this.createMesh()

    // Initial render
    this.renderCanvas()
  }

  /**
   * Create Three.js mesh with canvas texture
   * @returns {THREE.Mesh} Panel mesh
   */
  createMesh() {
    // Create plane geometry
    const geometry = new THREE.PlaneGeometry(this.width, this.height)

    // Create canvas texture
    this.texture = new THREE.CanvasTexture(this.canvas)
    this.texture.minFilter = THREE.LinearFilter
    this.texture.magFilter = THREE.LinearFilter

    // Create material
    const material = new THREE.MeshBasicMaterial({
      map: this.texture,
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide
    })

    // Create mesh
    const mesh = new THREE.Mesh(geometry, material)

    // Store reference for raycasting
    mesh.userData.speedPanel = this

    return mesh
  }

  /**
   * Render canvas with current state
   */
  renderCanvas() {
    const ctx = this.ctx
    const w = this.canvasWidth
    const h = this.canvasHeight

    // Clear canvas completely
    ctx.clearRect(0, 0, w, h)

    // Fill with transparent background to ensure clean slate
    ctx.fillStyle = 'rgba(0, 0, 0, 0)'
    ctx.fillRect(0, 0, w, h)

    // Glassmorphic background
    const gradient = ctx.createLinearGradient(0, 0, 0, h)
    if (this.isHovered) {
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.25)')
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0.15)')
    } else {
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)')
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0.05)')
    }
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, w, h)

    // Border glow
    const glowOpacity = this.isHovered ? 0.6 : 0.3
    const glowWidth = this.isHovered ? 3 : 2
    ctx.strokeStyle = `rgba(255, 255, 255, ${glowOpacity})`
    ctx.lineWidth = glowWidth
    ctx.strokeRect(glowWidth / 2, glowWidth / 2, w - glowWidth, h - glowWidth)

    // Current speed display (simplified - just show the speed)
    const currentSpeed = this.speedControl.getCurrentSpeed()
    const speedText = `${currentSpeed.toFixed(2)}x`

    ctx.font = 'bold 48px -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui'
    ctx.fillStyle = 'white'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillText(speedText, w / 2, 30)

    // Slider track
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.fillRect(this.sliderX, this.sliderY, this.sliderWidth, this.sliderHeight)

    // Slider fill (up to current position)
    const speedRange = this.speedControl.maxSpeed - this.speedControl.minSpeed
    const speedNormalized = (currentSpeed - this.speedControl.minSpeed) / speedRange
    const fillWidth = this.sliderWidth * speedNormalized
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
    ctx.fillRect(this.sliderX, this.sliderY, fillWidth, this.sliderHeight)

    // Tick marks (just visual marks, no text labels)
    this.ticks.forEach(tick => {
      const tickNormalized = (tick.value - this.speedControl.minSpeed) / speedRange
      const tickX = this.sliderX + this.sliderWidth * tickNormalized

      // Tick mark (subtle)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
      ctx.fillRect(tickX - 1, this.sliderY - 6, 2, 12)
    })

    // Slider thumb (larger and more prominent)
    const thumbX = this.sliderX + fillWidth
    const thumbY = this.sliderY + this.sliderHeight / 2

    // Outer glow when hovered/dragging
    if (this.hoveredSlider || this.isDragging) {
      ctx.beginPath()
      ctx.arc(thumbX, thumbY, this.thumbRadius + 4, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(100, 180, 255, 0.3)'
      ctx.fill()
    }

    // Thumb circle
    ctx.beginPath()
    ctx.arc(thumbX, thumbY, this.thumbRadius, 0, Math.PI * 2)
    ctx.fillStyle = this.isDragging ? 'rgba(100, 180, 255, 1.0)' :
                    this.hoveredSlider ? 'rgba(255, 255, 255, 1.0)' :
                    'rgba(255, 255, 255, 0.9)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'
    ctx.lineWidth = 3
    ctx.stroke()

    // Mark texture as needing update
    this.texture.needsUpdate = true
  }

  /**
   * Set hover state
   * @param {boolean} hovered - Is panel hovered
   */
  setHovered(hovered) {
    if (this.isHovered !== hovered) {
      this.isHovered = hovered
      this.renderCanvas()
    }
  }

  /**
   * Set slider hover state
   * @param {boolean} hovered - Is slider hovered
   */
  setSliderHovered(hovered) {
    if (this.hoveredSlider !== hovered) {
      this.hoveredSlider = hovered
      this.renderCanvas()
    }
  }

  /**
   * Set slider dragging state
   * @param {boolean} dragging - Is slider being dragged
   */
  setDragging(dragging) {
    if (this.isDragging !== dragging) {
      this.isDragging = dragging
      this.renderCanvas()
    }
  }

  /**
   * Handle slider click/drag
   * @param {number} normalizedX - X position normalized to slider (0-1)
   */
  onSliderInput(normalizedX) {
    const speedRange = this.speedControl.maxSpeed - this.speedControl.minSpeed
    const speed = this.speedControl.minSpeed + speedRange * normalizedX
    this.speedControl.setSpeed(speed)
  }

  /**
   * Update panel (call from animation loop)
   * Re-renders if speed is transitioning
   * @param {number} delta - Time elapsed since last frame (seconds)
   */
  update(delta) {
    // Re-render if speed is transitioning (for smooth slider animation)
    if (this.speedControl.isTransitioning()) {
      this.renderCanvas()
    }
  }

  /**
   * Get Three.js mesh
   * @returns {THREE.Mesh} Panel mesh
   */
  getMesh() {
    return this.mesh
  }

  /**
   * Check if point intersects slider (expanded hit area for easier grabbing)
   * @param {number} canvasX - X coordinate in canvas space
   * @param {number} canvasY - Y coordinate in canvas space
   * @returns {boolean} True if point is on slider
   */
  isPointOnSlider(canvasX, canvasY) {
    const sliderTop = this.sliderY - this.thumbRadius - 10
    const sliderBottom = this.sliderY + this.sliderHeight + this.thumbRadius + 10

    return canvasX >= this.sliderX && canvasX <= this.sliderX + this.sliderWidth &&
           canvasY >= sliderTop && canvasY <= sliderBottom
  }

  /**
   * Get normalized slider position from canvas X coordinate
   * @param {number} canvasX - X coordinate in canvas space
   * @returns {number} Normalized position (0-1)
   */
  getSliderNormalizedPosition(canvasX) {
    const relativeX = canvasX - this.sliderX
    return Math.max(0, Math.min(1, relativeX / this.sliderWidth))
  }

  /**
   * Dispose panel resources
   */
  dispose() {
    this.mesh.geometry.dispose()
    this.mesh.material.dispose()
    this.texture.dispose()
  }
}
