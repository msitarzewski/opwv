import * as THREE from 'three'
import { describe, expect, it, vi } from 'vitest'
import { Environment } from '../../src/environments/Environment.js'
import { SpatialHash } from '../../src/particles/SpatialHash.js'
import {
  calculateAlignment,
  calculateCohesion,
  calculateSeparation,
  calculateUserAttraction,
  calculateUserInteraction,
  wrapSphericalBounds
} from '../../src/particles/behaviors.js'
import { applyBrownianMotion } from '../../src/particles/behaviors/brownian.js'
import { applyFlowField } from '../../src/particles/behaviors/flow.js'
import { applyOrbitalMechanics } from '../../src/particles/behaviors/orbital.js'
import { apply4DRotation, Vector4D } from '../../src/particles/behaviors/rotation.js'
import { applySpringForce } from '../../src/particles/behaviors/spring.js'
import { applyWaveMotion } from '../../src/particles/behaviors/wave.js'
import spherePreset from '../../src/environments/presets/sphere.js'

describe('Environment validation and cloning', () => {
  it('constructs and deeply clones the complete preset contract', () => {
    const environment = new Environment(spherePreset)
    const clone = environment.clone()

    expect(clone).not.toBe(environment)
    expect(clone.toJSON()).toEqual(environment.toJSON())
    expect(clone.spatial.bounds).not.toBe(environment.spatial.bounds)
    expect(clone.behavior.modeParams).not.toBe(environment.behavior.modeParams)
    expect(clone.visual.renderMode).toBe(environment.visual.renderMode)
  })

  it.each([
    ['missing id', config => { config.id = '' }],
    ['missing name', config => { config.name = '' }],
    ['missing description', config => { config.description = null }],
    ['unknown spatial type', config => { config.spatial.type = 'cube' }],
    ['fractional count', config => { config.spatial.particleCount = 1.5 }],
    ['infinite count', config => { config.spatial.particleCount = Infinity }],
    ['excessive count', config => { config.spatial.particleCount = 65536 }],
    ['non-function initializer', config => { config.spatial.initializationFn = true }],
    ['missing custom initializer', config => { config.spatial.type = 'custom' }],
    ['unknown wrap mode', config => { config.spatial.wrapMode = 'portal' }],
    ['invalid bounds', config => { config.spatial.bounds.outerRadius = 1 }],
    ['unknown behavior', config => { config.behavior.mode = 'unknown' }],
    ['unknown renderer', config => { config.visual.renderMode = 'unknown' }],
    ['infinite behavior', config => { config.behavior.maxSpeed = Infinity }],
    ['negative behavior', config => { config.behavior.interactionRadius = -1 }],
    ['invalid palette', config => { config.visual.colorPalette = 'purple' }],
    ['empty palette', config => { config.visual.colorPalette = [] }],
    ['invalid particle size', config => { config.visual.particleSize = 0 }],
    ['invalid opacity', config => { config.visual.opacity = 2 }],
    ['invalid attenuation', config => { config.visual.sizeAttenuation = 'yes' }],
    ['invalid point scale', config => { config.visual.pointScale = 0 }],
    ['invalid emissive intensity', config => { config.visual.emissiveIntensity = -1 }],
    ['invalid target FPS', config => { config.performance.targetFPS = 0 }],
    ['invalid minimum FPS', config => { config.performance.minFPS = 0 }],
    ['invalid adaptive quality', config => { config.performance.adaptiveQuality = null }],
    ['inverted performance', config => { config.performance.minFPS = 100 }]
  ])('rejects %s', (_name, mutate) => {
    const config = structuredClonePreset(spherePreset)
    mutate(config)
    expect(() => new Environment(config)).toThrow()
  })
})

describe('SpatialHash', () => {
  it('indexes negative and positive cells and reuses a caller target', () => {
    const hash = new SpatialHash(1)
    const particles = [
      { position: new THREE.Vector3(-0.2, 0, 0) },
      { position: new THREE.Vector3(0.2, 0, 0) },
      { position: new THREE.Vector3(5, 0, 0) }
    ]
    hash.rebuild(particles)
    const target = ['stale']
    expect(hash.query(new THREE.Vector3(0, 0, 0), 1, target)).toBe(target)
    expect(target).toEqual([particles[0], particles[1]])
    hash.clear()
    expect(hash.query(new THREE.Vector3(), 1, target)).toEqual([])
  })

  it.each([0, -1, Infinity, NaN])('rejects invalid cell size %s', value => {
    expect(() => new SpatialHash(value)).toThrow()
  })
})

describe('particle forces', () => {
  const particle = () => ({
    position: new THREE.Vector3(),
    velocity: new THREE.Vector3()
  })

  it('returns zero flocking forces without neighbors', () => {
    const subject = particle()
    expect(calculateCohesion(subject, [], 1).length()).toBe(0)
    expect(calculateAlignment(subject, [], 1).length()).toBe(0)
    expect(calculateSeparation(subject, [], 1, 1).length()).toBe(0)
  })

  it('steers cohesion toward and separation away from a neighbor', () => {
    const subject = particle()
    const neighbor = particle()
    neighbor.position.set(1, 0, 0)
    neighbor.velocity.set(2, 0, 0)

    expect(calculateCohesion(subject, [neighbor], 1).x).toBeGreaterThan(0)
    expect(calculateAlignment(subject, [neighbor], 1).x).toBeGreaterThan(0)
    expect(calculateSeparation(subject, [neighbor], 2, 1).x).toBeLessThan(0)
  })

  it('applies bounded attraction and repulsion without NaN', () => {
    const subject = particle()
    subject.position.set(1, 0, 0)
    const attract = calculateUserInteraction(subject, {
      position: new THREE.Vector3(),
      mode: 'attract',
      strength: 2,
      radius: 4
    })
    const repel = calculateUserInteraction(subject, {
      position: new THREE.Vector3(),
      mode: 'repel',
      strength: 2,
      radius: 4
    })
    expect(attract.x).toBeLessThan(0)
    expect(repel.x).toBeGreaterThan(0)
    expect([...attract, ...repel].every(Number.isFinite)).toBe(true)
  })

  it('wraps particles beyond the outer sphere to the opposite inner radius', () => {
    const position = new THREE.Vector3(20, 0, 0)
    wrapSphericalBounds(position, 5, 10)
    expect(position.x).toBe(-5)
    expect(Math.abs(position.y)).toBe(0)
    expect(Math.abs(position.z)).toBe(0)
  })

  it('covers attraction boundaries and preserves in-range force direction', () => {
    const subject = particle()
    expect(calculateUserAttraction(subject, null, 1, 2).length()).toBe(0)
    expect(calculateUserAttraction(subject, { x: 0, y: 0 }, 1, 2).length()).toBe(0)
    expect(calculateUserAttraction(subject, { x: 3, y: 0, z: 0 }, 1, 2).length()).toBe(0)
    expect(calculateUserAttraction(subject, { x: 1, y: 0 }, 1, 2).x).toBeGreaterThan(0)

    expect(calculateUserInteraction(subject, null).length()).toBe(0)
    expect(calculateUserInteraction(subject, {}).length()).toBe(0)
    expect(calculateUserInteraction(subject, {
      position: new THREE.Vector3(),
      radius: -2,
      strength: Number.NaN
    }).length()).toBe(0)
  })
})

describe('environment behavior modes', () => {
  const particle = (x = 1, y = 0, z = 0) => ({
    position: new THREE.Vector3(x, y, z),
    velocity: new THREE.Vector3()
  })

  it('executes orbital, flow, spring, wave, and Brownian mode branches', () => {
    const orbital = particle()
    applyOrbitalMechanics(orbital, {}, 0.1)
    expect(orbital.velocity.length()).toBeGreaterThan(0)
    applyOrbitalMechanics(particle(0.01), {}, 0.1)

    const flow = particle()
    applyFlowField(flow, {}, 0.1)
    expect(flow.velocity.length()).toBeGreaterThan(0)
    applyFlowField(particle(0.01), {}, 0.1)
    applyFlowField(particle(2, 1, 0), {
      vortexAxis: new THREE.Vector3(0, 1, 0),
      rotationSpeed: 1,
      centripetalStrength: 0.25,
      upwardDrift: 0.2
    }, 0.1, {
      axisNorm: new THREE.Vector3(),
      axisVector: new THREE.Vector3(),
      radialVector: new THREE.Vector3(),
      tangent: new THREE.Vector3(),
      totalForce: new THREE.Vector3()
    })

    const anchored = particle(10)
    anchored.anchorPoint = new THREE.Vector3()
    applySpringForce(anchored, { springConstant: 4, damping: 0.9, maxForce: 1 }, 0.1)
    expect(anchored.velocity.x).toBeLessThan(0)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    applySpringForce(particle(), {}, 0.1)
    expect(warn).toHaveBeenCalledOnce()

    const wave = particle(1, 1, 1)
    applyWaveMotion(wave, {}, 1, 0.1)
    applyWaveMotion(wave, {
      waveSpeed: 2,
      amplitude: 1,
      frequency: 2,
      waveDirection: new THREE.Vector3(0, 0, 1)
    }, 2, 0.1)
    expect(wave.velocity.length()).toBeGreaterThan(0)

    const brownian = particle()
    applyBrownianMotion(brownian, {
      speed: 1,
      damping: 0.9,
      driftDirection: new THREE.Vector3(1, 0, 0),
      driftStrength: 1
    }, 0.1, { random: () => 0.75 })
    expect(brownian.velocity.length()).toBeGreaterThan(0)
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    applyBrownianMotion(brownian, {}, 0.1)
  })

  it('rotates initialized and existing 4D particles with safe projection', () => {
    const subject = particle(1, 2, 3)
    apply4DRotation(subject, {}, 0)
    expect(subject.rotation4D).toBeInstanceOf(Vector4D)
    expect([...subject.position, ...subject.velocity].every(Number.isFinite)).toBe(true)

    subject.rotation4D = new Vector4D(1, 1, 1, 2)
    apply4DRotation(subject, {
      rotationSpeedXW: 0,
      rotationSpeedYW: 0,
      rotationSpeedZW: 0,
      projectionDistance: 2
    }, 0.1)
    expect([...subject.velocity].every(Number.isFinite)).toBe(true)
  })
})

function structuredClonePreset(preset) {
  return {
    ...preset,
    spatial: {
      ...preset.spatial,
      bounds: { ...preset.spatial.bounds }
    },
    behavior: {
      ...preset.behavior,
      modeParams: { ...preset.behavior.modeParams }
    },
    visual: {
      ...preset.visual,
      colorPalette: preset.visual.colorPalette
        ? [...preset.visual.colorPalette]
        : null
    },
    performance: { ...preset.performance }
  }
}
