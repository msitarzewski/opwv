// ControllerInput - WebXR controller handling for VR spatial UI
// Supports controller raycasting, trigger button, and haptic feedback

import * as THREE from 'three'

/**
 * ControllerInput class - Handles VR controller input for UI selection
 *
 * Features:
 * - XRInputSource detection and tracking
 * - Controller raycasting for UI interaction
 * - Trigger button (index 0) handling
 * - Haptic feedback on hover and selection
 * - Support for traditional VR controllers (Quest, Vive, etc.)
 * - Support for Vision Pro hand tracking with pinch gestures (transient-pointer)
 */
export class ControllerInput {
  /**
   * Create a controller input handler
   * @param {THREE.WebGLRenderer} renderer - Three.js renderer with xr enabled
   * @param {Object} options - Configuration options
   */
  constructor(renderer, options = {}) {
    this.renderer = renderer
    this.enabled = true

    // Raycasting configuration
    this.raycastDistance = options.raycastDistance || 100

    // Controller state
    this.controllers = []
    this.hoveredCard = null
    this.triggerPressed = false

    // Raycaster for controller pointing
    this.raycaster = new THREE.Raycaster()
    this.raycaster.far = this.raycastDistance

    // Temporary vectors for raycasting
    this.tempMatrix = new THREE.Matrix4()
    this.controllerPosition = new THREE.Vector3()
    this.controllerDirection = new THREE.Vector3()

    // Selection callback
    this.onSelect = null

    // Initialize controller tracking
    this.initializeControllers()
  }

  /**
   * Initialize WebXR controller tracking
   * Sets up XRInputSource listeners
   *
   * Note: Vision Pro hand tracking uses transient-pointer inputs at indices 2-3
   * when hand-tracking is enabled (indices 0-1 are persistent tracked-pointer for hands)
   */
  initializeControllers() {
    // Get XR controller references from renderer
    // Three.js provides getController() for input sources
    // Support up to 4 inputs to handle Vision Pro transient-pointer (pinch) inputs
    for (let i = 0; i < 4; i++) {
      const controller = this.renderer.xr.getController(i)

      if (controller) {
        // Store controller reference
        this.controllers.push({
          index: i,
          controller: controller,
          gamepad: null,
          inputSource: null
        })

        // Add event listeners for controller buttons
        controller.addEventListener('selectstart', (event) => this.onSelectStart(event, i))
        controller.addEventListener('selectend', (event) => this.onSelectEnd(event, i))
        controller.addEventListener('connected', (event) => this.onControllerConnected(event, i))
        controller.addEventListener('disconnected', (event) => this.onControllerDisconnected(event, i))
      }
    }
  }

  /**
   * Handle controller connected event
   * @param {Object} event - Connected event
   * @param {number} index - Controller index
   */
  onControllerConnected(event, index) {
    const data = event.data
    const controllerData = this.controllers[index]

    if (controllerData) {
      controllerData.inputSource = data
      controllerData.gamepad = data.gamepad
      console.log(`Input ${index} connected:`, data.handedness, data.targetRayMode)
    }
  }

  /**
   * Handle controller disconnected event
   * @param {Object} event - Disconnected event
   * @param {number} index - Controller index
   */
  onControllerDisconnected(event, index) {
    const controllerData = this.controllers[index]

    if (controllerData) {
      controllerData.inputSource = null
      controllerData.gamepad = null
      console.log(`Controller ${index} disconnected`)
    }
  }

  /**
   * Handle trigger button press start
   * @param {Object} event - Select start event
   * @param {number} index - Controller index
   */
  onSelectStart(event, index) {
    this.triggerPressed = true

    // Trigger haptic feedback (if supported)
    this.triggerHaptic(index, 0.5, 50) // 50ms pulse at 50% intensity
  }

  /**
   * Handle trigger button press end
   * @param {Object} event - Select end event
   * @param {number} index - Controller index
   */
  onSelectEnd(event, index) {
    this.triggerPressed = false

    // If hovering a card, trigger selection
    if (this.hoveredCard) {
      this.triggerSelection(this.hoveredCard, index)
    }
  }

  /**
   * Enable or disable controller input
   * @param {boolean} enabled - Enable state
   */
  setEnabled(enabled) {
    this.enabled = enabled

    // Reset state when disabled
    if (!enabled) {
      this.resetController()
    }
  }

  /**
   * Update controller input (call every frame)
   * @param {XRSession|null} xrSession - Active XR session
   * @param {Array<THREE.Mesh>} cardMeshes - Array of card meshes to raycast against
   */
  update(xrSession, cardMeshes) {
    if (!this.enabled || !xrSession || !cardMeshes || cardMeshes.length === 0) {
      return
    }

    // Check each controller for raycasting
    for (const controllerData of this.controllers) {
      const controller = controllerData.controller

      if (!controller || !controller.visible) {
        continue
      }

      // Get controller world matrix
      this.tempMatrix.identity().extractRotation(controller.matrixWorld)

      // Get controller position
      this.controllerPosition.setFromMatrixPosition(controller.matrixWorld)

      // Get controller direction (pointing forward in local -Z)
      this.controllerDirection.set(0, 0, -1).applyMatrix4(this.tempMatrix)

      // Update raycaster with controller position and direction
      this.raycaster.set(this.controllerPosition, this.controllerDirection)

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
            }

            // Set new hover
            this.hoveredCard = hitCard
            this.hoveredCard.setHovered(true)

            // Haptic feedback on hover
            this.triggerHaptic(controllerData.index, 0.3, 30)
          }
        }

        // Only check first controller with hit (prioritize)
        return
      }
    }

    // No controller hit - clear hover state
    if (this.hoveredCard) {
      this.hoveredCard.setHovered(false)
      this.hoveredCard = null
    }
  }

  /**
   * Trigger haptic feedback on controller
   * @param {number} index - Controller index
   * @param {number} intensity - Haptic intensity 0-1
   * @param {number} duration - Duration in milliseconds
   */
  triggerHaptic(index, intensity = 0.5, duration = 100) {
    const controllerData = this.controllers[index]

    if (!controllerData || !controllerData.gamepad) {
      return
    }

    const gamepad = controllerData.gamepad

    // Check if haptic actuators are available
    if (gamepad.hapticActuators && gamepad.hapticActuators.length > 0) {
      const actuator = gamepad.hapticActuators[0]

      // Trigger pulse
      if (actuator.pulse) {
        actuator.pulse(intensity, duration).catch(err => {
          console.warn('Haptic feedback failed:', err)
        })
      }
    }
  }

  /**
   * Trigger selection for a card
   * @param {EnvironmentCard} card - Selected card
   * @param {number} controllerIndex - Controller that triggered selection
   */
  triggerSelection(card, controllerIndex) {
    // Strong haptic feedback on selection
    this.triggerHaptic(controllerIndex, 0.8, 100)

    if (this.onSelect && typeof this.onSelect === 'function') {
      this.onSelect({
        type: 'controller',
        presetId: card.presetId,
        environment: card.environment,
        card: card,
        controllerIndex: controllerIndex
      })
    }
  }

  /**
   * Reset controller state (clear hover)
   */
  resetController() {
    if (this.hoveredCard) {
      this.hoveredCard.setHovered(false)
      this.hoveredCard = null
    }

    this.triggerPressed = false
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
   * Get all controller references
   * @returns {Array} Controller data array
   */
  getControllers() {
    return this.controllers
  }

  /**
   * Dispose controller input
   */
  dispose() {
    this.resetController()
    this.onSelect = null
    this.controllers = []
  }
}
