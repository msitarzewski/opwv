import * as THREE from 'three'

const PINCH_DISTANCE = 0.035
const OPEN_HAND_DISTANCE = 0.12

export class ParticleInteraction {
  constructor({ hands = [], controllerInput = null } = {}) {
    this.hands = Array.isArray(hands) ? [...hands] : []
    this.controllerInput = controllerInput
    this.enabled = true
    this.sources = []
    this.sourcePool = []
    this.activePinchPositions = []
    this.handPositions = this.hands.map(() => ({
      index: new THREE.Vector3(),
      thumb: new THREE.Vector3(),
      wrist: new THREE.Vector3(),
      midpoint: new THREE.Vector3()
    }))
    this.controllerPosition = new THREE.Vector3()
    this.twoHandMidpoint = new THREE.Vector3()
  }

  setEnabled(enabled) {
    this.enabled = Boolean(enabled)
    if (!this.enabled) {
      this.sources.length = 0
    }
  }

  update(xrSession) {
    this.sources.length = 0
    this.activePinchPositions.length = 0

    if (!this.enabled || !xrSession) {
      return this.sources
    }

    this.collectHandSources()
    this.collectControllerSources()
    this.addTwoHandField()
    return this.sources
  }

  collectHandSources() {
    for (let index = 0; index < this.hands.length; index++) {
      const hand = this.hands[index]
      const joints = hand?.joints
      const indexTip = joints?.['index-finger-tip']
      const thumbTip = joints?.['thumb-tip']
      const wrist = joints?.wrist

      if (!indexTip?.visible || !thumbTip?.visible) {
        continue
      }

      const positions = this.handPositions[index]
      indexTip.getWorldPosition(positions.index)
      thumbTip.getWorldPosition(positions.thumb)
      positions.midpoint.copy(positions.index).add(positions.thumb).multiplyScalar(0.5)

      if (positions.index.distanceToSquared(positions.thumb) <= PINCH_DISTANCE ** 2) {
        const source = this.addSource(positions.midpoint, {
          mode: 'attract',
          strength: 2,
          radius: 4.5,
          input: 'hand',
          index
        })
        this.activePinchPositions.push(source.position)
        continue
      }

      if (wrist?.visible) {
        wrist.getWorldPosition(positions.wrist)
        if (positions.index.distanceToSquared(positions.wrist) >= OPEN_HAND_DISTANCE ** 2) {
          this.addSource(positions.midpoint, {
            mode: 'repel',
            strength: 1.2,
            radius: 3.5,
            input: 'hand',
            index
          })
        }
      }
    }
  }

  collectControllerSources() {
    if (
      this.controllerInput?.hoveredCard ||
      this.controllerInput?.hoveredPanel ||
      this.controllerInput?.hoveredToggle
    ) {
      return
    }

    const controllers = this.controllerInput?.getControllers?.() || []

    for (const controllerData of controllers) {
      const controller = controllerData.controller
      const buttons = controllerData.gamepad?.buttons

      if (!controller?.visible || !buttons) {
        continue
      }

      const attractPressed = Boolean(buttons[0]?.pressed)
      const repelPressed = Boolean(buttons[1]?.pressed)
      if (!attractPressed && !repelPressed) {
        continue
      }

      controller.getWorldPosition(this.controllerPosition)
      this.addSource(this.controllerPosition, {
        mode: repelPressed ? 'repel' : 'attract',
        strength: repelPressed ? 1.4 : 2,
        radius: 4,
        input: 'controller',
        index: controllerData.index
      })
    }
  }

  addTwoHandField() {
    if (this.activePinchPositions.length < 2) {
      return
    }

    const left = this.activePinchPositions[0]
    const right = this.activePinchPositions[1]
    const distance = left.distanceTo(right)
    this.twoHandMidpoint.copy(left).add(right).multiplyScalar(0.5)
    this.addSource(this.twoHandMidpoint, {
      mode: 'attract',
      strength: Math.min(2.5, 1 + distance * 2),
      radius: Math.min(7, 4 + distance * 2),
      input: 'two-hand',
      index: -1
    })
  }

  addSource(position, properties) {
    const sourceIndex = this.sources.length
    let source = this.sourcePool[sourceIndex]
    if (!source) {
      source = {
        position: new THREE.Vector3(),
        mode: 'attract',
        strength: 0,
        radius: 0,
        input: '',
        index: -1
      }
      this.sourcePool.push(source)
    }

    source.position.copy(position)
    source.mode = properties.mode
    source.strength = properties.strength
    source.radius = properties.radius
    source.input = properties.input
    source.index = properties.index
    this.sources.push(source)
    return source
  }

  dispose() {
    this.sources.length = 0
    this.sourcePool.length = 0
    this.activePinchPositions.length = 0
    this.hands = []
    this.controllerInput = null
  }
}
