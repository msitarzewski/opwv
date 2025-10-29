// UI Toggle Orb - Floating button to show/hide spatial UI
// Positioned below camera, out of peripheral vision

import * as THREE from 'three'

/**
 * UIToggleOrb class - Floating orb button for toggling spatial UI visibility
 *
 * Creates a small glowing sphere positioned below the user's view.
 * Gaze-based dwell timer (0.8s) or pinch gesture toggles UI panels on/off.
 * Provides subtle visual feedback without cluttering the immersive experience.
 */
export class UIToggleOrb {
  /**
   * Create a UI toggle orb
   * @param {Function} onToggle - Callback when orb is activated (toggle UI)
   */
  constructor(onToggle) {
    this.onToggle = onToggle
    this.isHovered = false
    this.dwellProgress = 0
    this.uiVisible = true // Track UI visibility state

    // Orb dimensions (small visual, large hit area)
    this.visualSize = 0.10 // Visual size (10cm diameter - small and subtle)
    this.hitSize = 0.35    // Hit area (35cm - much larger for easy targeting)

    // Canvas for orb texture
    this.canvasSize = 256
    this.canvas = document.createElement('canvas')
    this.canvas.width = this.canvasSize
    this.canvas.height = this.canvasSize
    this.ctx = this.canvas.getContext('2d')

    // Create visible sphere (visual)
    const visualGeometry = new THREE.SphereGeometry(this.visualSize, 32, 32)
    this.texture = new THREE.CanvasTexture(this.canvas)
    this.texture.needsUpdate = true

    const visualMaterial = new THREE.MeshBasicMaterial({
      map: this.texture,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide
    })

    this.mesh = new THREE.Mesh(visualGeometry, visualMaterial)

    // Create invisible hit sphere (larger for easier targeting)
    const hitGeometry = new THREE.SphereGeometry(this.hitSize, 16, 16)
    const hitMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0, // Completely invisible
      side: THREE.DoubleSide
    })

    this.hitSphere = new THREE.Mesh(hitGeometry, hitMaterial)
    this.mesh.add(this.hitSphere) // Child of visible mesh

    // Position below and in front of camera (out of peripheral vision)
    // Will be updated in SpatialUI to track camera
    this.mesh.position.set(0, -1.8, -3)

    // Initial render
    this.renderCanvas()
  }

  /**
   * Render canvas texture (icon + state visualization)
   */
  renderCanvas() {
    const ctx = this.ctx
    const size = this.canvasSize
    const center = size / 2

    // Clear canvas
    ctx.clearRect(0, 0, size, size)

    // Background circle (glassmorphic)
    const gradient = ctx.createRadialGradient(center, center, 0, center, center, center)

    if (this.isHovered) {
      // Pulsing glow when hovered
      gradient.addColorStop(0, 'rgba(100, 180, 255, 0.4)')
      gradient.addColorStop(0.6, 'rgba(100, 180, 255, 0.2)')
      gradient.addColorStop(1, 'rgba(100, 180, 255, 0)')
    } else if (this.uiVisible) {
      // Brighter when UI is visible
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)')
      gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.15)')
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
    } else {
      // Subtle when UI is hidden
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)')
      gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.1)')
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
    }

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(center, center, center * 0.9, 0, Math.PI * 2)
    ctx.fill()

    // Border ring
    ctx.strokeStyle = this.isHovered
      ? 'rgba(100, 180, 255, 0.8)'
      : 'rgba(255, 255, 255, 0.4)'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(center, center, center * 0.85, 0, Math.PI * 2)
    ctx.stroke()

    // Icon: Three horizontal dots (⋮ rotated 90°)
    const dotRadius = 8
    const dotSpacing = 30
    ctx.fillStyle = this.isHovered
      ? 'rgba(100, 180, 255, 1.0)'
      : 'rgba(255, 255, 255, 0.9)'

    // Three dots horizontally centered
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath()
      ctx.arc(center + i * dotSpacing, center, dotRadius, 0, Math.PI * 2)
      ctx.fill()
    }

    // Dwell progress ring
    if (this.dwellProgress > 0) {
      const radius = center * 0.95
      const startAngle = -Math.PI / 2
      const endAngle = startAngle + (Math.PI * 2 * this.dwellProgress)

      ctx.strokeStyle = 'rgba(100, 180, 255, 0.9)'
      ctx.lineWidth = 6
      ctx.beginPath()
      ctx.arc(center, center, radius, startAngle, endAngle)
      ctx.stroke()
    }

    this.texture.needsUpdate = true
  }

  /**
   * Set hover state
   * @param {boolean} hovered
   */
  setHovered(hovered) {
    if (this.isHovered !== hovered) {
      this.isHovered = hovered
      this.renderCanvas()
    }
  }

  /**
   * Set dwell progress (0-1)
   * @param {number} progress
   */
  setDwellProgress(progress) {
    this.dwellProgress = Math.max(0, Math.min(1, progress))
    this.renderCanvas()
  }

  /**
   * Trigger toggle action
   */
  trigger() {
    if (this.onToggle) {
      this.onToggle()
    }
  }

  /**
   * Set UI visibility state (for visual feedback)
   * @param {boolean} visible
   */
  setUIVisible(visible) {
    if (this.uiVisible !== visible) {
      this.uiVisible = visible
      this.renderCanvas()
    }
  }

  /**
   * Update orb (called each frame)
   * @param {THREE.Camera} camera - Camera for billboard rotation
   */
  update(camera) {
    // Orb is stationary in world space (doesn't follow camera)
    // Only update rotation to face camera (billboard effect)
    this.mesh.lookAt(camera.position)
  }

  /**
   * Set orb position in world space (call once during initialization)
   * @param {THREE.Vector3} position - World space position
   */
  setPosition(position) {
    this.mesh.position.copy(position)
  }

  /**
   * Get THREE.Mesh for adding to scene
   * @returns {THREE.Mesh}
   */
  getMesh() {
    return this.mesh
  }

  /**
   * Dispose resources
   */
  dispose() {
    // Dispose hit sphere
    if (this.hitSphere) {
      this.hitSphere.geometry.dispose()
      this.hitSphere.material.dispose()
    }

    // Dispose visible mesh
    this.mesh.geometry.dispose()
    this.mesh.material.dispose()
    this.texture.dispose()
  }
}
