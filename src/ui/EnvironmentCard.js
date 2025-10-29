// EnvironmentCard - Individual environment selection card with canvas-based rendering
// Renders glassmorphic card with environment info as texture on PlaneGeometry

import * as THREE from 'three'

/**
 * EnvironmentCard class - Represents a single environment selection card in VR space
 *
 * Features:
 * - Canvas-based rendering (HTML5 Canvas → CanvasTexture)
 * - Glassmorphic visual design (Vision Pro aesthetic)
 * - Hover and selection states with visual feedback
 * - Text rendering for environment name and description
 * - Optimized for VR performance (updates only on state change)
 */
export class EnvironmentCard {
  /**
   * Create an environment card
   * @param {string} presetId - Environment preset identifier
   * @param {Environment} environment - Environment instance with metadata
   * @param {Object} options - Card configuration options
   */
  constructor(presetId, environment, options = {}) {
    this.presetId = presetId
    this.environment = environment

    // Card dimensions (world units)
    this.width = options.width || 1.5
    this.height = options.height || 2.0

    // Canvas resolution (pixels) - balance quality/performance
    this.canvasWidth = 512
    this.canvasHeight = Math.floor(512 * (this.height / this.width)) // Maintain aspect ratio

    // Card state
    this.isHovered = false
    this.isSelected = false
    this.dwellProgress = 0 // 0-1 for gaze dwell timer visualization

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
   * @returns {THREE.Mesh} Card mesh
   */
  createMesh() {
    // Create plane geometry
    const geometry = new THREE.PlaneGeometry(this.width, this.height)

    // Create canvas texture
    this.texture = new THREE.CanvasTexture(this.canvas)
    this.texture.minFilter = THREE.LinearFilter
    this.texture.magFilter = THREE.LinearFilter

    // Create material with canvas texture
    const material = new THREE.MeshBasicMaterial({
      map: this.texture,
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide
    })

    // Create mesh
    const mesh = new THREE.Mesh(geometry, material)

    // Store reference for raycasting
    mesh.userData.card = this

    return mesh
  }

  /**
   * Render card content to canvas
   * Called on state changes (hover, selection, dwell progress)
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

    // === Background (glassmorphic gradient) ===
    const gradient = ctx.createLinearGradient(0, 0, 0, h)

    if (this.isSelected) {
      // Selected state: brighter, more opaque
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.35)')
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0.25)')
    } else if (this.isHovered) {
      // Hover state: slightly brighter
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.25)')
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0.15)')
    } else {
      // Default state: subtle transparency
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)')
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0.05)')
    }

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, w, h)

    // === Border glow ===
    const glowOpacity = this.isSelected ? 0.6 : this.isHovered ? 0.4 : 0.3
    const glowWidth = this.isSelected ? 3 : 2

    ctx.strokeStyle = `rgba(255, 255, 255, ${glowOpacity})`
    ctx.lineWidth = glowWidth
    ctx.strokeRect(glowWidth / 2, glowWidth / 2, w - glowWidth, h - glowWidth)

    // === Environment name (centered, large) ===
    ctx.font = 'bold 72px -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui'
    ctx.fillStyle = 'white'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(this.environment.name, w / 2, h / 2 - 40)

    // === Environment description (smaller, subtle) ===
    ctx.font = '20px -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui'
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'

    // Single line description (truncate if too long)
    const description = this.environment.description
    const maxWidth = w - 60
    let displayText = description

    if (ctx.measureText(description).width > maxWidth) {
      // Truncate with ellipsis
      const words = description.split(' ')
      displayText = ''
      for (let i = 0; i < words.length; i++) {
        const testLine = displayText + words[i] + ' '
        if (ctx.measureText(testLine).width > maxWidth) {
          displayText = displayText.trim() + '...'
          break
        }
        displayText = testLine
      }
    }

    ctx.fillText(displayText, w / 2, h / 2 + 50)

    // === Dwell progress indicator (bottom, only if hovering) ===
    if (this.isHovered && this.dwellProgress > 0) {
      const progressY = h - 80
      const progressWidth = w - 120
      const progressHeight = 8
      const progressX = (w - progressWidth) / 2

      // Background bar
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
      ctx.fillRect(progressX, progressY, progressWidth, progressHeight)

      // Progress fill
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
      ctx.fillRect(progressX, progressY, progressWidth * this.dwellProgress, progressHeight)
    }

    // Update texture
    this.texture.needsUpdate = true
  }

  /**
   * Set hover state
   * @param {boolean} hovered - Whether card is hovered
   */
  setHovered(hovered) {
    if (this.isHovered !== hovered) {
      this.isHovered = hovered
      this.renderCanvas()

      // Reset dwell progress when hover ends
      if (!hovered) {
        this.setDwellProgress(0)
      }
    }
  }

  /**
   * Set selection state
   * @param {boolean} selected - Whether card is selected
   */
  setSelected(selected) {
    if (this.isSelected !== selected) {
      this.isSelected = selected
      this.renderCanvas()
    }
  }

  /**
   * Set dwell progress for gaze selection visualization
   * @param {number} progress - Progress value 0-1
   */
  setDwellProgress(progress) {
    const clampedProgress = Math.max(0, Math.min(1, progress))

    if (Math.abs(this.dwellProgress - clampedProgress) > 0.01) {
      this.dwellProgress = clampedProgress

      // Only re-render if hovering (optimization)
      if (this.isHovered) {
        this.renderCanvas()
      }
    }
  }

  /**
   * Get Three.js mesh for scene integration
   * @returns {THREE.Mesh} Card mesh
   */
  getMesh() {
    return this.mesh
  }

  /**
   * Set card position in 3D space
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   */
  setPosition(x, y, z) {
    this.mesh.position.set(x, y, z)
  }

  /**
   * Make card face a target position (typically camera)
   * @param {THREE.Vector3} target - Target position to face
   */
  lookAt(target) {
    this.mesh.lookAt(target)
  }

  /**
   * Set card scale (for animations)
   * @param {number} scale - Uniform scale factor
   */
  setScale(scale) {
    this.mesh.scale.setScalar(scale)
  }

  /**
   * Dispose card resources
   * Cleans up geometry, material, texture, and canvas
   */
  dispose() {
    // Dispose Three.js resources
    this.mesh.geometry.dispose()
    this.mesh.material.dispose()
    this.texture.dispose()

    // Clear canvas reference
    this.canvas = null
    this.ctx = null
  }
}
