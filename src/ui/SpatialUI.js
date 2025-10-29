// SpatialUI - Vision Pro-style spatial UI manager for VR environment selection
// Orchestrates environment cards, gaze selection, and controller input

import * as THREE from 'three'
import { EnvironmentCard } from './EnvironmentCard.js'
import { GazeController } from './GazeController.js'
import { ControllerInput } from './ControllerInput.js'

/**
 * SpatialUI class - Manages VR spatial UI for environment selection
 *
 * Features:
 * - Vision Pro-style floating cards arranged in arc
 * - Gaze-based selection (dwell time)
 * - Controller-based selection (trigger button)
 * - Visibility toggle (show/hide UI)
 * - Integration with EnvironmentManager
 * - Smooth animations and transitions
 */
export class SpatialUI {
  /**
   * Create spatial UI manager
   * @param {THREE.Scene} scene - Three.js scene
   * @param {THREE.Camera} camera - Active VR camera
   * @param {THREE.WebGLRenderer} renderer - Three.js renderer with xr enabled
   * @param {EnvironmentManager} environmentManager - Environment manager instance
   */
  constructor(scene, camera, renderer, environmentManager) {
    this.scene = scene
    this.camera = camera
    this.renderer = renderer
    this.environmentManager = environmentManager

    // UI state
    this.visible = false
    this.cards = []
    this.cardMeshes = []

    // UI container group (for easy show/hide)
    this.uiGroup = new THREE.Group()
    this.uiGroup.visible = false
    this.scene.add(this.uiGroup)

    // Spatial layout configuration
    this.arcRadius = 4.0 // Distance from camera
    this.cardWidth = 1.5
    this.cardHeight = 2.0
    this.angularSpacing = 25 * (Math.PI / 180) // 25 degrees in radians

    // Input controllers
    this.gazeController = new GazeController(camera, {
      dwellTime: 0.8,
      raycastDistance: 100
    })

    this.controllerInput = new ControllerInput(renderer, {
      raycastDistance: 100
    })

    // Set selection callbacks
    this.gazeController.setOnSelect((event) => this.onCardSelected(event))
    this.controllerInput.setOnSelect((event) => this.onCardSelected(event))

    // Initialize UI (load available environments)
    this.initializeUI()
  }

  /**
   * Initialize UI with available environments
   * Creates cards for each loaded environment
   */
  async initializeUI() {
    // Get available environments from manager
    const availableEnvironments = this.environmentManager.getAvailableEnvironments()

    // Clear existing cards
    this.clearCards()

    // Create card for each environment
    const presetIds = Array.from(availableEnvironments.keys())

    for (let i = 0; i < presetIds.length; i++) {
      const presetId = presetIds[i]
      const environment = availableEnvironments.get(presetId)

      // Create card
      const card = new EnvironmentCard(presetId, environment, {
        width: this.cardWidth,
        height: this.cardHeight
      })

      // Calculate arc position
      const position = this.calculateArcPosition(i, presetIds.length)

      // Set card position
      card.setPosition(position.x, position.y, position.z)

      // Make card face camera
      card.lookAt(this.camera.position)

      // Add card mesh to UI group
      this.uiGroup.add(card.getMesh())

      // Store card reference
      this.cards.push(card)
      this.cardMeshes.push(card.getMesh())
    }

    // Mark currently active environment
    this.updateSelectedCard()

    console.log(`SpatialUI initialized: ${this.cards.length} environment cards`)
  }

  /**
   * Calculate arc position for card
   * @param {number} index - Card index in array
   * @param {number} totalCards - Total number of cards
   * @returns {THREE.Vector3} Card position
   */
  calculateArcPosition(index, totalCards) {
    // Calculate arc span (max 180 degrees)
    const maxArcSpan = Math.PI // 180 degrees
    const arcSpan = Math.min(maxArcSpan, this.angularSpacing * (totalCards + 1))

    // Calculate angle for this card
    // Center the arc around forward direction (-Z in Three.js)
    const startAngle = -arcSpan / 2
    const angleStep = arcSpan / (totalCards + 1)
    const angle = startAngle + angleStep * (index + 1)

    // Calculate position on arc
    // Arc in XZ plane (y=0 for eye level)
    const x = this.arcRadius * Math.sin(angle)
    const z = -this.arcRadius * Math.cos(angle)
    const y = 0 // Eye level (camera at origin)

    return new THREE.Vector3(x, y, z)
  }

  /**
   * Update selected card visual state
   * Marks the currently active environment
   */
  updateSelectedCard() {
    const currentEnvironment = this.environmentManager.getCurrentEnvironment()

    if (!currentEnvironment) {
      return
    }

    // Find and mark selected card
    for (const card of this.cards) {
      const isSelected = card.environment === currentEnvironment
      card.setSelected(isSelected)
    }
  }

  /**
   * Handle card selection event
   * @param {Object} event - Selection event from gaze or controller
   */
  async onCardSelected(event) {
    console.log(`Environment selected: ${event.presetId} (via ${event.type})`)

    try {
      // Switch environment
      await this.environmentManager.switchEnvironment(event.presetId)

      // Update selected card visual state
      this.updateSelectedCard()

      // Keep UI visible so user can select other environments
      // (Don't auto-hide - user can manually hide with gesture/button)
      console.log('Environment switched - UI staying visible for further selection')
    } catch (error) {
      console.error('Failed to switch environment:', error)
      // TODO: Show error feedback in VR (future enhancement)
    }
  }

  /**
   * Show spatial UI
   */
  show() {
    if (!this.visible) {
      this.visible = true
      this.uiGroup.visible = true

      // Enable input controllers
      this.gazeController.setEnabled(true)
      this.controllerInput.setEnabled(true)

      // Refresh UI (in case environments changed)
      this.initializeUI()

      console.log('SpatialUI shown')
    }
  }

  /**
   * Hide spatial UI
   */
  hide() {
    if (this.visible) {
      this.visible = false
      this.uiGroup.visible = false

      // Disable input controllers
      this.gazeController.setEnabled(false)
      this.controllerInput.setEnabled(false)

      // Debug: Log stack trace to see who called hide()
      console.log('SpatialUI hidden - called from:')
      console.trace()
    }
  }

  /**
   * Toggle spatial UI visibility
   */
  toggle() {
    if (this.visible) {
      this.hide()
    } else {
      this.show()
    }
  }

  /**
   * Update spatial UI (call every frame)
   * @param {XRSession|null} xrSession - Active XR session
   * @param {number} delta - Time elapsed since last frame (seconds)
   */
  update(xrSession, delta) {
    if (!this.visible) {
      return
    }

    // Update gaze controller
    this.gazeController.update(delta, this.cardMeshes)

    // Update controller input
    this.controllerInput.update(xrSession, this.cardMeshes)
  }

  /**
   * Get UI visibility state
   * @returns {boolean} Whether UI is visible
   */
  isVisible() {
    return this.visible
  }

  /**
   * Clear all cards
   */
  clearCards() {
    // Dispose and remove all cards
    for (const card of this.cards) {
      this.uiGroup.remove(card.getMesh())
      card.dispose()
    }

    this.cards = []
    this.cardMeshes = []
  }

  /**
   * Dispose spatial UI
   * Cleans up all resources
   */
  dispose() {
    // Dispose input controllers
    this.gazeController.dispose()
    this.controllerInput.dispose()

    // Clear all cards
    this.clearCards()

    // Remove UI group from scene
    this.scene.remove(this.uiGroup)

    console.log('SpatialUI disposed')
  }
}
