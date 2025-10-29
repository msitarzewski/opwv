// GazeController - Gaze-based selection system for VR spatial UI
// Uses camera raycasting and dwell time for comfortable VR interaction

import * as THREE from 'three'

/**
 * GazeController class - Handles gaze-based selection for VR UI
 *
 * Features:
 * - Raycaster from camera center (user's gaze direction)
 * - Dwell timer for selection (0.8s comfortable threshold)
 * - Progress tracking for visual feedback
 * - Selection event emission
 * - Hit detection against card meshes
 */
export class GazeController {
  /**
   * Create a gaze controller
   * @param {THREE.Camera} camera - Active VR camera
   * @param {Object} options - Configuration options
   */
  constructor(camera, options = {}) {
    this.camera = camera
    this.enabled = true

    // Gaze configuration
    this.dwellTime = options.dwellTime || 0.8 // seconds to trigger selection
    this.raycastDistance = options.raycastDistance || 100

    // Raycaster for center of view (gaze direction)
    this.raycaster = new THREE.Raycaster()
    this.raycaster.far = this.raycastDistance

    // Gaze state
    this.hoveredCard = null
    this.hoveredObject = null // Generic hovered object (card or speed panel)
    this.sliderPosition = null // For speed panel slider (0-1)
    this.dwellTimer = 0
    this.lastUpdateTime = 0

    // Selection callback
    this.onSelect = null
  }

  /**
   * Enable or disable gaze controller
   * @param {boolean} enabled - Enable state
   */
  setEnabled(enabled) {
    this.enabled = enabled

    // Reset state when disabled
    if (!enabled) {
      this.resetGaze()
    }
  }

  /**
   * Update gaze controller (call every frame)
   * @param {number} delta - Time elapsed since last frame (seconds)
   * @param {Array<THREE.Mesh>} interactableMeshes - Array of meshes to raycast against
   */
  update(delta, interactableMeshes) {
    if (!this.enabled || !interactableMeshes || interactableMeshes.length === 0) {
      return
    }

    // Raycast from camera center (gaze direction)
    // Use center of view (0, 0 in normalized device coordinates)
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera)

    // Check for intersections with interactable meshes
    const intersects = this.raycaster.intersectObjects(interactableMeshes, false)

    if (intersects.length > 0) {
      // Hit something - get closest intersection
      const intersection = intersects[0]
      const hitMesh = intersection.object
      const hitCard = hitMesh.userData.card
      const hitSpeedPanel = hitMesh.userData.speedPanel

      // Handle environment card intersection
      if (hitCard) {
        this.handleCardHover(hitCard, delta)
      }
      // Handle speed panel intersection
      else if (hitSpeedPanel) {
        this.handleSpeedPanelHover(hitSpeedPanel, intersection, delta)
      }
    } else {
      // No hit - clear hover state
      this.clearHover()
    }
  }

  /**
   * Handle hovering over environment card
   * @param {EnvironmentCard} card - Hovered card
   * @param {number} delta - Time since last frame
   */
  handleCardHover(card, delta) {
    // Clear speed panel hover if switching from panel to card
    if (this.hoveredObject && this.hoveredObject !== card) {
      this.clearHover()
    }

    // If we just started hovering this card
    if (this.hoveredCard !== card) {
      // Set new hover
      this.hoveredCard = card
      this.hoveredObject = card
      this.hoveredCard.setHovered(true)
      this.dwellTimer = 0
    }

    // Update dwell timer
    this.dwellTimer += delta

    // Calculate dwell progress (0-1)
    const progress = Math.min(1.0, this.dwellTimer / this.dwellTime)
    this.hoveredCard.setDwellProgress(progress)

    // Trigger selection when dwell time reached
    if (this.dwellTimer >= this.dwellTime) {
      this.triggerCardSelection(this.hoveredCard)
      this.resetGaze()
    }
  }

  /**
   * Handle hovering over speed panel
   * @param {SpeedControlPanel} panel - Hovered speed panel
   * @param {Object} intersection - Raycast intersection data
   * @param {number} delta - Time since last frame
   */
  handleSpeedPanelHover(panel, intersection, delta) {
    // Clear card hover if switching from card to panel
    if (this.hoveredCard) {
      this.hoveredCard.setHovered(false)
      this.hoveredCard.setDwellProgress(0)
      this.hoveredCard = null
    }

    // Get UV coordinates from intersection
    const uv = intersection.uv
    if (!uv) {
      return
    }

    // Convert UV (0-1) to canvas pixel coordinates
    const canvasX = uv.x * panel.canvasWidth
    const canvasY = (1 - uv.y) * panel.canvasHeight // Flip Y (UV origin is bottom-left, canvas is top-left)

    // Check if hovering over slider
    const isOnSlider = panel.isPointOnSlider(canvasX, canvasY)

    // Update panel hover state
    panel.setHovered(true)
    panel.setSliderHovered(isOnSlider)

    // If we just started hovering the panel
    if (this.hoveredObject !== panel) {
      this.dwellTimer = 0
      this.hoveredObject = panel
    }

    // If hovering over slider, allow interaction via dwell or direct drag
    if (isOnSlider) {
      // Store current slider position for potential drag
      const normalizedX = panel.getSliderNormalizedPosition(canvasX)
      this.sliderPosition = normalizedX

      // Update dwell timer for pinch-to-grab gesture
      this.dwellTimer += delta

      // After dwell time, trigger slider input
      if (this.dwellTimer >= this.dwellTime) {
        panel.onSliderInput(normalizedX)
        this.dwellTimer = 0 // Reset for continuous adjustment
      }
    } else {
      this.dwellTimer = 0
      this.sliderPosition = null
    }
  }

  /**
   * Clear all hover states
   */
  clearHover() {
    if (this.hoveredCard) {
      this.hoveredCard.setHovered(false)
      this.hoveredCard.setDwellProgress(0)
      this.hoveredCard = null
    }

    if (this.hoveredObject && this.hoveredObject.setHovered) {
      this.hoveredObject.setHovered(false)
      if (this.hoveredObject.setSliderHovered) {
        this.hoveredObject.setSliderHovered(false)
      }
    }

    this.hoveredObject = null
    this.sliderPosition = null
    this.dwellTimer = 0
  }

  /**
   * Trigger selection for a card
   * @param {EnvironmentCard} card - Selected card
   */
  triggerCardSelection(card) {
    if (this.onSelect && typeof this.onSelect === 'function') {
      this.onSelect({
        type: 'gaze',
        presetId: card.presetId,
        environment: card.environment,
        card: card
      })
    }
  }

  /**
   * Get current slider position (if hovering over slider)
   * @returns {number|null} Slider position (0-1) or null
   */
  getSliderPosition() {
    return this.sliderPosition
  }

  /**
   * Reset gaze state (clear hover and timer)
   */
  resetGaze() {
    this.clearHover()
  }

  /**
   * Set selection callback
   * @param {Function} callback - Callback function receiving selection event
   */
  setOnSelect(callback) {
    this.onSelect = callback
  }

  /**
   * Get currently hovered card
   * @returns {EnvironmentCard|null} Hovered card or null
   */
  getHoveredCard() {
    return this.hoveredCard
  }

  /**
   * Get current dwell progress (0-1)
   * @returns {number} Progress value
   */
  getDwellProgress() {
    if (!this.hoveredCard) {
      return 0
    }

    return Math.min(1.0, this.dwellTimer / this.dwellTime)
  }

  /**
   * Dispose gaze controller
   */
  dispose() {
    this.resetGaze()
    this.onSelect = null
  }
}
