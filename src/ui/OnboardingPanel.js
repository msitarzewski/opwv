// Spatial first-run guidance and user-facing error feedback

import * as THREE from 'three'

const STORAGE_KEY = 'opwv_spatial_onboarding_complete'

/**
 * Canvas-backed spatial panel for first-run instructions and transient errors.
 */
export class OnboardingPanel {
  /**
   * @param {Object} options
   * @param {number} options.width - Panel width in world units
   * @param {number} options.height - Panel height in world units
   * @param {Storage|null} options.storage - Storage implementation for completion state
   */
  constructor(options = {}) {
    this.width = options.width || 3.4
    this.height = options.height || 1.55
    this.storage = options.storage === undefined ? this.getStorage() : options.storage
    this.canvasWidth = 1024
    this.canvasHeight = Math.round(this.canvasWidth * (this.height / this.width))
    this.mode = 'onboarding'
    this.errorMessage = ''

    this.canvas = document.createElement('canvas')
    this.canvas.width = this.canvasWidth
    this.canvas.height = this.canvasHeight
    this.ctx = this.canvas.getContext('2d')

    this.texture = new THREE.CanvasTexture(this.canvas)
    this.texture.colorSpace = THREE.SRGBColorSpace

    const geometry = new THREE.PlaneGeometry(this.width, this.height)
    const material = new THREE.MeshBasicMaterial({
      map: this.texture,
      transparent: true,
      depthTest: false,
      side: THREE.DoubleSide
    })

    this.mesh = new THREE.Mesh(geometry, material)
    this.mesh.renderOrder = 1000
    this.mesh.visible = false
    this.renderCanvas()
  }

  /**
   * Access localStorage without failing in restricted/private contexts.
   * @returns {Storage|null}
   */
  getStorage() {
    try {
      return window.localStorage
    } catch {
      return null
    }
  }

  /**
   * Whether the first-run guide still needs to be shown.
   * @returns {boolean}
   */
  shouldShow() {
    try {
      return this.storage?.getItem(STORAGE_KEY) !== 'true'
    } catch {
      return true
    }
  }

  /**
   * Show first-run guidance.
   * @param {boolean} force - Show even when previously completed
   * @returns {boolean} Whether the panel was shown
   */
  show(force = false) {
    if (!force && !this.shouldShow()) {
      return false
    }

    this.mode = 'onboarding'
    this.errorMessage = ''
    this.renderCanvas()
    this.mesh.visible = true
    return true
  }

  /**
   * Hide the panel without changing completion state.
   */
  hide() {
    this.mesh.visible = false
  }

  /**
   * Mark onboarding complete and hide it.
   */
  complete() {
    try {
      this.storage?.setItem(STORAGE_KEY, 'true')
    } catch {
      // Storage is optional; the current session can still continue.
    }
    this.hide()
  }

  /**
   * Present a concise user-facing spatial error.
   * @param {string} message - Safe text rendered to canvas
   */
  showError(message) {
    this.mode = 'error'
    this.errorMessage = typeof message === 'string' && message.trim()
      ? message.trim().slice(0, 180)
      : 'Something interrupted the experience. Please try again.'
    this.renderCanvas()
    this.mesh.visible = true
  }

  /**
   * Position the panel in world space.
   * @param {THREE.Vector3} position
   */
  setPosition(position) {
    this.mesh.position.copy(position)
  }

  /**
   * Face the active camera.
   * @param {THREE.Camera} camera
   */
  update(camera) {
    if (this.mesh.visible) {
      this.mesh.lookAt(camera.position)
    }
  }

  /**
   * Render either onboarding guidance or an error message.
   */
  renderCanvas() {
    const ctx = this.ctx
    const width = this.canvasWidth
    const height = this.canvasHeight

    ctx.clearRect(0, 0, width, height)

    const gradient = ctx.createLinearGradient(0, 0, width, height)
    if (this.mode === 'error') {
      gradient.addColorStop(0, 'rgba(75, 12, 22, 0.96)')
      gradient.addColorStop(1, 'rgba(30, 8, 18, 0.94)')
    } else {
      gradient.addColorStop(0, 'rgba(22, 18, 43, 0.94)')
      gradient.addColorStop(1, 'rgba(8, 10, 24, 0.9)')
    }

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
    ctx.strokeStyle = this.mode === 'error'
      ? 'rgba(255, 183, 189, 0.8)'
      : 'rgba(213, 201, 255, 0.62)'
    ctx.lineWidth = 4
    ctx.strokeRect(2, 2, width - 4, height - 4)

    if (this.mode === 'error') {
      this.renderError(ctx, width, height)
    } else {
      this.renderOnboarding(ctx, width)
    }

    this.texture.needsUpdate = true
  }

  renderOnboarding(ctx, width) {
    ctx.fillStyle = '#d9ceff'
    ctx.font = '700 28px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText('WELCOME TO OPWV', 60, 48)

    ctx.fillStyle = '#ffffff'
    ctx.font = '600 56px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    ctx.fillText('Explore with your attention.', 60, 98)

    const steps = [
      ['LOOK', 'Rest your gaze on a world card.'],
      ['SELECT', 'Hold your gaze, pinch, or press trigger.'],
      ['ADJUST', 'Point at the slider to change the pace.'],
      ['MENU', 'Look down for the glowing orb, or press M.']
    ]

    const columnWidth = (width - 120) / 2
    steps.forEach(([label, copy], index) => {
      const column = index % 2
      const row = Math.floor(index / 2)
      const x = 60 + column * columnWidth
      const y = 205 + row * 108

      ctx.fillStyle = '#bda8ff'
      ctx.font = '700 22px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
      ctx.fillText(label, x, y)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.82)'
      ctx.font = '400 25px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
      this.fillWrappedText(ctx, copy, x, y + 34, columnWidth - 36, 31)
    })

    ctx.fillStyle = 'rgba(255, 255, 255, 0.56)'
    ctx.font = '400 21px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    ctx.fillText('This guide closes after your first selection.', 60, 432)
  }

  renderError(ctx, width, height) {
    ctx.fillStyle = '#ffb7bd'
    ctx.font = '700 28px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText('ENVIRONMENT UNAVAILABLE', 60, 62)

    ctx.fillStyle = '#ffffff'
    ctx.font = '600 46px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    this.fillWrappedText(ctx, this.errorMessage, 60, 125, width - 120, 58)

    ctx.fillStyle = 'rgba(255, 255, 255, 0.68)'
    ctx.font = '400 24px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    ctx.fillText('Choose another world or try again.', 60, height - 72)
  }

  fillWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(/\s+/)
    let line = ''
    let lineY = y

    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word
      if (line && ctx.measureText(candidate).width > maxWidth) {
        ctx.fillText(line, x, lineY)
        line = word
        lineY += lineHeight
      } else {
        line = candidate
      }
    }

    if (line) {
      ctx.fillText(line, x, lineY)
    }
  }

  getMesh() {
    return this.mesh
  }

  dispose() {
    this.mesh.geometry.dispose()
    this.mesh.material.dispose()
    this.texture.dispose()
  }
}
