// SpatialUI - Vision Pro-style spatial UI manager for VR environment selection
// Orchestrates environment cards, gaze selection, and controller input

import * as THREE from 'three'
import { EnvironmentCard } from './EnvironmentCard.js'
import { GazeController } from './GazeController.js'
import { ControllerInput } from './ControllerInput.js'
import { SpeedControlPanel } from './SpeedControlPanel.js'
import { GazeCursor } from './GazeCursor.js'

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
   * @param {SpeedControl} speedControl - Optional speed control instance
   */
  constructor(scene, camera, renderer, environmentManager, speedControl = null) {
    this.scene = scene
    this.camera = camera
    this.renderer = renderer
    this.environmentManager = environmentManager
    this.speedControl = speedControl

    // UI state
    this.visible = false
    this.cards = []
    this.cardMeshes = []
    this.speedPanel = null
    this.allInteractableMeshes = [] // Combined cards + speed panel meshes

    // UI container group (for easy show/hide)
    this.uiGroup = new THREE.Group()
    this.uiGroup.visible = false
    this.scene.add(this.uiGroup)

    // Spatial layout configuration
    this.arcRadius = 4.0 // Distance from camera
    this.cardWidth = 1.2  // Reduced from 1.5
    this.cardHeight = 1.4 // Reduced from 2.0 (30% smaller)
    this.angularSpacing = 25 * (Math.PI / 180) // 25 degrees in radians

    // Input controllers
    this.gazeController = new GazeController(camera, {
      dwellTime: 0.8,
      raycastDistance: 100
    })

    this.controllerInput = new ControllerInput(renderer, {
      raycastDistance: 100
    })

    // Gaze cursor (visual feedback for where user is looking)
    this.gazeCursor = new GazeCursor(camera, {
      distance: 2.0,
      size: 0.02
    })
    this.uiGroup.add(this.gazeCursor.getMesh())

    // Set selection callbacks
    this.gazeController.setOnSelect((event) => this.onSelection(event))
    this.controllerInput.setOnSelect((event) => this.onSelection(event))

    // Initialize UI (load available environments and speed control)
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

    // Create speed control panel if speedControl is available
    if (this.speedControl) {
      this.speedPanel = new SpeedControlPanel(this.speedControl)
      // Uses default size: 2.5 x 0.8 world units

      // Position speed panel well below environment cards to avoid overlap
      const panelPosition = new THREE.Vector3(0, -1.6, -this.arcRadius)
      this.speedPanel.getMesh().position.copy(panelPosition)
      this.speedPanel.getMesh().lookAt(this.camera.position)

      // Add to UI group
      this.uiGroup.add(this.speedPanel.getMesh())

      console.log('Speed control panel added to spatial UI')
    }

    // Build combined mesh list for raycasting
    this.allInteractableMeshes = [...this.cardMeshes]
    if (this.speedPanel) {
      this.allInteractableMeshes.push(this.speedPanel.getMesh())
    }

    // Mark currently active environment
    this.updateSelectedCard()

    console.log(`SpatialUI initialized: ${this.cards.length} environment cards${this.speedPanel ? ' + speed panel' : ''}`)
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
   * Handle selection event (environment cards only)
   * @param {Object} event - Selection event from gaze or controller
   */
  async onSelection(event) {
    // Check if selection is environment card
    if (event.presetId) {
      await this.onCardSelected(event)
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

    // Update gaze controller with all interactable meshes
    this.gazeController.update(delta, this.allInteractableMeshes)

    // Check if hovering over speed panel (hide cursor for cleaner UI)
    const hoveredObject = this.gazeController.hoveredObject
    const isHoveringUI = hoveredObject && (hoveredObject.setSliderHovered || hoveredObject.setDwellProgress)

    // Update gaze cursor position (hide when hovering UI)
    this.gazeCursor.update(delta, isHoveringUI)

    // Update gaze cursor dwell progress (only for cards, not panels)
    if (!isHoveringUI) {
      const dwellProgress = this.gazeController.getDwellProgress()
      this.gazeCursor.setDwellProgress(dwellProgress)
    } else {
      this.gazeCursor.setDwellProgress(0)
    }

    // Update speed panel (handles lerping animation)
    if (this.speedPanel) {
      this.speedPanel.update(delta)
    }

    // Update controller input with all interactable meshes
    this.controllerInput.update(xrSession, this.allInteractableMeshes)

    // Handle speed panel interactions
    this.handleSpeedPanelInteractions()
  }

  /**
   * Handle gaze/controller interactions with speed panel
   * Slider interaction is now handled directly in GazeController.handleSpeedPanelHover
   */
  handleSpeedPanelInteractions() {
    // Slider interaction handled in GazeController via UV coordinate detection
    // No additional handling needed here
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
    this.allInteractableMeshes = []
  }

  /**
   * Dispose spatial UI
   * Cleans up all resources
   */
  dispose() {
    // Dispose input controllers
    this.gazeController.dispose()
    this.controllerInput.dispose()

    // Dispose gaze cursor
    if (this.gazeCursor) {
      this.uiGroup.remove(this.gazeCursor.getMesh())
      this.gazeCursor.dispose()
      this.gazeCursor = null
    }

    // Dispose speed panel
    if (this.speedPanel) {
      this.uiGroup.remove(this.speedPanel.getMesh())
      this.speedPanel.dispose()
      this.speedPanel = null
    }

    // Clear all cards
    this.clearCards()

    // Remove UI group from scene
    this.scene.remove(this.uiGroup)

    console.log('SpatialUI disposed')
  }
}
