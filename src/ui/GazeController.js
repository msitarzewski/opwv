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
   * @param {Array<THREE.Mesh>} cardMeshes - Array of card meshes to raycast against
   */
  update(delta, cardMeshes) {
    if (!this.enabled || !cardMeshes || cardMeshes.length === 0) {
      return
    }

    // Raycast from camera center (gaze direction)
    // Use center of view (0, 0 in normalized device coordinates)
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera)

    // Check for intersections with card meshes
    const intersects = this.raycaster.intersectObjects(cardMeshes, false)

    if (intersects.length > 0) {
      // Hit a card - get closest intersection
      const hitMesh = intersects[0].object
      const hitCard = hitMesh.userData.card

      if (hitCard) {
        // If we just started hovering this card
        if (this.hoveredCard !== hitCard) {
          // Clear previous hover
          if (this.hoveredCard) {
            this.hoveredCard.setHovered(false)
            this.hoveredCard.setDwellProgress(0)
          }

          // Set new hover
          this.hoveredCard = hitCard
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
          this.triggerSelection(this.hoveredCard)
          this.resetGaze()
        }
      }
    } else {
      // No hit - clear hover state
      if (this.hoveredCard) {
        this.hoveredCard.setHovered(false)
        this.hoveredCard.setDwellProgress(0)
        this.hoveredCard = null
        this.dwellTimer = 0
      }
    }
  }

  /**
   * Trigger selection for a card
   * @param {EnvironmentCard} card - Selected card
   */
  triggerSelection(card) {
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
   * Reset gaze state (clear hover and timer)
   */
  resetGaze() {
    if (this.hoveredCard) {
      this.hoveredCard.setHovered(false)
      this.hoveredCard.setDwellProgress(0)
      this.hoveredCard = null
    }

    this.dwellTimer = 0
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
