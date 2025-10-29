// GazeCursor - Visual gaze cursor/reticle for VR
// Shows where user is looking and dwell timer progress

import * as THREE from 'three'

/**
 * GazeCursor class - Renders gaze reticle in center of view
 *
 * Features:
 * - Always-visible center crosshair
 * - Dwell timer progress ring
 * - Subtle glow for visibility
 */
export class GazeCursor {
  /**
   * Create gaze cursor
   * @param {THREE.Camera} camera - VR camera
   * @param {Object} options - Configuration options
   */
  constructor(camera, options = {}) {
    this.camera = camera
    this.distance = options.distance || 2.0 // Distance from camera
    this.size = options.size || 0.02 // Cursor size in world units
    this.dwellProgress = 0 // 0-1 for dwell timer visualization

    // Create cursor mesh
    this.createCursor()
  }

  /**
   * Create cursor geometry and material
   */
  createCursor() {
    // Create canvas for cursor texture
    const canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 128
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')

    // Create plane geometry for cursor
    const geometry = new THREE.PlaneGeometry(this.size, this.size)

    // Create canvas texture
    this.texture = new THREE.CanvasTexture(canvas)
    this.texture.minFilter = THREE.LinearFilter
    this.texture.magFilter = THREE.LinearFilter

    // Create material
    const material = new THREE.MeshBasicMaterial({
      map: this.texture,
      transparent: true,
      opacity: 1.0,
      depthTest: false, // Always visible on top
      depthWrite: false
    })

    // Create mesh
    this.mesh = new THREE.Mesh(geometry, material)
    this.mesh.renderOrder = 9999 // Render last (on top)

    // Initial render
    this.renderCursor()
  }

  /**
   * Render cursor to canvas
   */
  renderCursor() {
    const ctx = this.ctx
    const w = this.canvas.width
    const h = this.canvas.height
    const center = w / 2

    // Clear canvas
    ctx.clearRect(0, 0, w, h)

    // Crosshair (always visible)
    const crosshairSize = 12
    const crosshairWidth = 2
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)'
    ctx.lineWidth = crosshairWidth

    // Horizontal line
    ctx.beginPath()
    ctx.moveTo(center - crosshairSize, center)
    ctx.lineTo(center + crosshairSize, center)
    ctx.stroke()

    // Vertical line
    ctx.beginPath()
    ctx.moveTo(center, center - crosshairSize)
    ctx.lineTo(center, center + crosshairSize)
    ctx.stroke()

    // Center dot
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
    ctx.beginPath()
    ctx.arc(center, center, 3, 0, Math.PI * 2)
    ctx.fill()

    // Dwell progress ring (if active)
    if (this.dwellProgress > 0) {
      const radius = 20
      const startAngle = -Math.PI / 2 // Start at top
      const endAngle = startAngle + (Math.PI * 2 * this.dwellProgress)

      ctx.strokeStyle = 'rgba(100, 180, 255, 0.9)'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.arc(center, center, radius, startAngle, endAngle)
      ctx.stroke()

      // Outer glow ring
      ctx.strokeStyle = 'rgba(100, 180, 255, 0.3)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(center, center, radius + 4, 0, Math.PI * 2)
      ctx.stroke()
    }

    // Update texture
    this.texture.needsUpdate = true
  }

  /**
   * Update cursor position (always in center of camera view)
   * @param {number} delta - Time since last frame
   * @param {boolean} hideOnUI - Hide cursor when hovering UI elements
   */
  update(delta, hideOnUI = false) {
    // Hide cursor when hovering UI elements (cleaner interaction)
    if (hideOnUI) {
      this.mesh.visible = false
      return
    } else {
      this.mesh.visible = true
    }

    // Position cursor in front of camera
    const direction = new THREE.Vector3(0, 0, -1)
    direction.applyQuaternion(this.camera.quaternion)

    this.mesh.position.copy(this.camera.position)
    this.mesh.position.add(direction.multiplyScalar(this.distance))

    // Make cursor face camera
    this.mesh.quaternion.copy(this.camera.quaternion)
  }

  /**
   * Set dwell progress (0-1)
   * @param {number} progress - Progress value
   */
  setDwellProgress(progress) {
    if (this.dwellProgress !== progress) {
      this.dwellProgress = progress
      this.renderCursor()
    }
  }

  /**
   * Get cursor mesh
   * @returns {THREE.Mesh}
   */
  getMesh() {
    return this.mesh
  }

  /**
   * Dispose cursor resources
   */
  dispose() {
    this.mesh.geometry.dispose()
    this.mesh.material.dispose()
    this.texture.dispose()
  }
}
