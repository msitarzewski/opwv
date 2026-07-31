import * as THREE from 'three'
import { Particle } from './Particle.js'
import {
  calculateAlignment,
  calculateCohesion,
  calculateSeparation,
  calculateUserInteraction,
  wrapSphericalBounds
} from './behaviors.js'
import { applyBrownianMotion } from './behaviors/brownian.js'
import { applyFlowField } from './behaviors/flow.js'
import { applyOrbitalMechanics } from './behaviors/orbital.js'
import { apply4DRotation } from './behaviors/rotation.js'
import { applySpringForce } from './behaviors/spring.js'
import { applyWaveMotion } from './behaviors/wave.js'
import { Environment } from '../environments/Environment.js'
import { generatePalette } from '../utils/colors.js'
import { NoiseField } from '../utils/noise.js'
import { ParticleRenderer } from './ParticleRenderer.js'
import { SpatialHash } from './SpatialHash.js'

/**
 * Environment-driven particle simulation.
 *
 * Physics state remains independent from ParticleRenderer so adaptive quality
 * can alter the active simulation/draw range without reallocating GPU buffers.
 */
export class ParticleSystem {
  constructor(environment, _unused = null, rng = null) {
    if (!(environment instanceof Environment)) {
      throw new Error('ParticleSystem requires an Environment instance')
    }

    this.environment = environment
    this.rng = rng
    this.time = 0
    this.bounds = environment.spatial.bounds
    this.maxCount = environment.spatial.particleCount
    this.count = this.maxCount
    this.particles = []

    this.palette = environment.visual.colorPalette
      ? environment.visual.colorPalette.map(color => new THREE.Color(color))
      : rng
        ? generatePalette(rng, 3)
        : null

    this.config = {
      cohesionRadius: environment.behavior.cohesionRadius,
      cohesionWeight: environment.behavior.cohesionWeight,
      alignmentRadius: environment.behavior.alignmentRadius,
      alignmentWeight: environment.behavior.alignmentWeight,
      separationRadius: environment.behavior.separationRadius,
      separationWeight: environment.behavior.separationWeight,
      maxSpeed: environment.behavior.maxSpeed,
      interactionStrength: environment.behavior.interactionStrength,
      interactionRadius: environment.behavior.interactionRadius,
      interactionMaxSpeed: environment.behavior.interactionMaxSpeed
    }

    this.noiseField = new NoiseField(
      environment.behavior.noiseScale,
      environment.behavior.noiseStrength,
      rng && typeof rng.random === 'function' ? () => rng.random() : Math.random
    )

    this.initializeParticles()

    const maxNeighborRadius = Math.max(
      this.config.cohesionRadius,
      this.config.alignmentRadius,
      this.config.separationRadius,
      0.001
    )
    this.spatialHash = new SpatialHash(maxNeighborRadius)
    this.spatialHash.rebuild(this.particles, this.count)
    this.spatialCandidates = []
    this.cohesionNeighbors = []
    this.alignmentNeighbors = []
    this.separationNeighbors = []

    this.cohesionForce = new THREE.Vector3()
    this.alignmentForce = new THREE.Vector3()
    this.separationForce = new THREE.Vector3()
    this.separationScratch = new THREE.Vector3()
    this.noiseForce = new THREE.Vector3()
    this.interactionForce = new THREE.Vector3()
    this.behaviorScratch = new THREE.Vector3()
    this.rotationProjectedPosition = new THREE.Vector3()
    this.flowScratch = {
      axisNorm: new THREE.Vector3(),
      axisVector: new THREE.Vector3(),
      radialVector: new THREE.Vector3(),
      tangent: new THREE.Vector3(),
      totalForce: new THREE.Vector3()
    }
    this.singleInteractionPosition = new THREE.Vector3()
    this.singleInteraction = {
      position: this.singleInteractionPosition,
      mode: 'attract',
      strength: 1,
      radius: this.config.interactionRadius
    }

    this.particleRenderer = new ParticleRenderer(this.particles, environment)
    // Compatibility aliases for diagnostics and focused tests.
    this.geometry = this.particleRenderer.geometry
    this.material = this.particleRenderer.material
    this.points = this.particleRenderer.getObject3D()
  }

  initializeParticles() {
    const initializationFn = this.environment.spatial.initializationFn

    for (let i = 0; i < this.maxCount; i++) {
      if (!initializationFn) {
        this.particles.push(new Particle(this.bounds, this.rng, this.palette))
        continue
      }

      const properties = initializationFn(
        this.rng,
        this.palette,
        this.bounds,
        i,
        this.maxCount
      )

      if (!properties?.position?.isVector3 ||
          !properties?.velocity?.isVector3 ||
          !properties?.color?.isColor) {
        throw new Error(
          `${this.environment.id} initialization must return position, velocity, and color`
        )
      }

      this.particles.push({
        ...properties,
        size: Number.isFinite(properties.size) && properties.size > 0
          ? properties.size
          : this.environment.visual.particleSize
      })
    }
  }

  /**
   * Compatibility query backed by the current frame's spatial hash.
   */
  findNeighbors(particle, radius, target = []) {
    this.spatialHash.query(particle.position, radius, target)
    const radiusSquared = radius * radius
    let writeIndex = 0

    for (const other of target) {
      if (other !== particle &&
          particle.position.distanceToSquared(other.position) < radiusSquared) {
        target[writeIndex++] = other
      }
    }
    target.length = writeIndex
    return target
  }

  classifyFlockingNeighbors(particle) {
    const maxRadius = this.spatialHash.cellSize
    this.spatialHash.query(particle.position, maxRadius, this.spatialCandidates)
    this.cohesionNeighbors.length = 0
    this.alignmentNeighbors.length = 0
    this.separationNeighbors.length = 0

    const cohesionRadiusSquared = this.config.cohesionRadius ** 2
    const alignmentRadiusSquared = this.config.alignmentRadius ** 2
    const separationRadiusSquared = this.config.separationRadius ** 2

    for (const other of this.spatialCandidates) {
      if (other === particle) continue
      const distanceSquared = particle.position.distanceToSquared(other.position)
      if (distanceSquared < cohesionRadiusSquared) this.cohesionNeighbors.push(other)
      if (distanceSquared < alignmentRadiusSquared) this.alignmentNeighbors.push(other)
      if (distanceSquared < separationRadiusSquared) this.separationNeighbors.push(other)
    }
  }

  applyFlockingBehavior(particle, delta) {
    this.classifyFlockingNeighbors(particle)

    calculateCohesion(
      particle,
      this.cohesionNeighbors,
      this.config.cohesionWeight,
      this.cohesionForce
    )
    calculateAlignment(
      particle,
      this.alignmentNeighbors,
      this.config.alignmentWeight,
      this.alignmentForce
    )
    calculateSeparation(
      particle,
      this.separationNeighbors,
      this.config.separationRadius,
      this.config.separationWeight,
      this.separationForce,
      this.separationScratch
    )

    this.noiseField.get3D(
      particle.position.x,
      particle.position.y,
      particle.position.z,
      this.time,
      this.noiseForce
    )

    const frameScale = delta * 72
    particle.velocity
      .addScaledVector(this.cohesionForce, frameScale)
      .addScaledVector(this.alignmentForce, frameScale)
      .addScaledVector(this.separationForce, frameScale)
      .addScaledVector(this.noiseForce, frameScale)

    this.clampVelocity(particle, this.config.maxSpeed)
  }

  applyModeBehavior(particle, delta) {
    const { mode, modeParams } = this.environment.behavior

    switch (mode) {
      case 'flocking':
        this.applyFlockingBehavior(particle, delta)
        break
      case 'brownian':
        applyBrownianMotion(particle, modeParams, delta, this.rng, this.behaviorScratch)
        break
      case 'orbital':
        applyOrbitalMechanics(particle, modeParams, delta, this.behaviorScratch)
        break
      case 'spring':
        applySpringForce(particle, modeParams, delta, this.behaviorScratch)
        break
      case 'flow':
        applyFlowField(particle, modeParams, delta, this.flowScratch)
        break
      case 'wave':
        applyWaveMotion(particle, modeParams, this.time, delta, this.behaviorScratch)
        break
      case 'rotation':
        apply4DRotation(
          particle,
          modeParams,
          delta,
          this.behaviorScratch,
          this.rotationProjectedPosition
        )
        break
      default:
        // Environment validation prevents this branch.
        throw new Error(`Unsupported behavior mode: ${mode}`)
    }
  }

  applyInteractionForces(particle, forceSources, delta) {
    if (!forceSources || (Array.isArray(forceSources) && forceSources.length === 0)) return

    const sources = forceSources
    if (!Array.isArray(forceSources)) {
      // Retain compatibility with the prior {x, y, z?} interaction shape.
      if (!Number.isFinite(forceSources.x) || !Number.isFinite(forceSources.y)) return
      this.singleInteractionPosition.set(
        forceSources.x,
        forceSources.y,
        Number.isFinite(forceSources.z) ? forceSources.z : 0
      )
      calculateUserInteraction(particle, this.singleInteraction, this.interactionForce)
      particle.velocity.addScaledVector(
        this.interactionForce,
        this.config.interactionStrength * delta
      )
      this.clampVelocity(particle, this.config.interactionMaxSpeed)
      return
    }

    for (const source of sources) {
      calculateUserInteraction(particle, source, this.interactionForce)
      particle.velocity.addScaledVector(
        this.interactionForce,
        this.config.interactionStrength * delta
      )
    }

    this.clampVelocity(particle, this.config.interactionMaxSpeed)
  }

  clampVelocity(particle, maxSpeed) {
    if (maxSpeed <= 0) return
    const speedSquared = particle.velocity.lengthSq()
    if (speedSquared > maxSpeed * maxSpeed) {
      particle.velocity.multiplyScalar(maxSpeed / Math.sqrt(speedSquared))
    }
  }

  applyBounds(particle) {
    if (this.environment.spatial.wrapMode === 'spherical') {
      wrapSphericalBounds(
        particle.position,
        this.bounds.innerRadius,
        this.bounds.outerRadius
      )
    }
  }

  update(delta, forceSources = null) {
    if (!Number.isFinite(delta) || delta <= 0) return
    const safeDelta = Math.min(delta, 0.1)
    this.time += safeDelta

    if (this.environment.behavior.mode === 'flocking') {
      this.spatialHash.rebuild(this.particles, this.count)
    }

    // Resolve forces against one coherent position snapshot. Integrating in a
    // second pass keeps the spatial hash valid for the entire flocking step.
    for (let i = 0; i < this.count; i++) {
      const particle = this.particles[i]
      this.applyModeBehavior(particle, safeDelta)
      this.applyInteractionForces(particle, forceSources, safeDelta)
    }

    for (let i = 0; i < this.count; i++) {
      const particle = this.particles[i]
      particle.position.addScaledVector(particle.velocity, safeDelta)
      this.applyBounds(particle)
    }

    this.particleRenderer.sync(this.count)
  }

  getPoints() {
    return this.points
  }

  getActiveCount() {
    return this.count
  }

  getMaxCount() {
    return this.maxCount
  }

  setParticleCount(count, minCount = 1) {
    if (!Number.isFinite(count) || !Number.isFinite(minCount)) {
      return this.count
    }
    const minimum = Math.min(this.maxCount, Math.max(1, Math.floor(minCount)))
    this.count = Math.max(minimum, Math.min(this.maxCount, Math.floor(count)))
    this.particleRenderer.setActiveCount(this.count)
    return this.count
  }

  reduceParticleCount(reductionRate = 0.15, minCount = 100) {
    const rate = Number.isFinite(reductionRate)
      ? Math.max(0, Math.min(1, reductionRate))
      : 0
    return this.setParticleCount(Math.floor(this.count * (1 - rate)), minCount)
  }

  restoreParticleCount(recoveryRate = 0.1) {
    if (!Number.isFinite(recoveryRate)) return this.count
    const rate = Math.max(0, Math.min(1, recoveryRate))
    const increase = Math.max(1, Math.ceil(this.maxCount * rate))
    return this.setParticleCount(Math.min(this.maxCount, this.count + increase))
  }

  dispose() {
    this.spatialHash.clear()
    this.particleRenderer.dispose()
    this.particles.length = 0
  }
}
