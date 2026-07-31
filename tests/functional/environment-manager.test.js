import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { SpeedControl } from '../../src/controls/SpeedControl.js'
import { EnvironmentManager } from '../../src/environments/EnvironmentManager.js'
import { SeededRandom } from '../../src/utils/random.js'
import { getEnvironmentIds } from '../../src/utils/sceneState.js'

describe('EnvironmentManager integration', () => {
  it('loads and immediately activates every allowlisted environment', async () => {
    const manager = createManager()

    try {
      for (const id of getEnvironmentIds()) {
        const environment = await manager.loadPreset(id)
        expect(environment.id).toBe(id)
      }
      expect(manager.getAvailableEnvironments().size).toBe(7)

      for (const id of getEnvironmentIds()) {
        await expect(manager.switchEnvironment(id, { immediate: true }))
          .resolves.toBe(true)
        const system = manager.getParticleSystem()
        expect(manager.getCurrentEnvironment().id).toBe(id)
        expect(system.getActiveCount()).toBeGreaterThan(0)
        expect(system.geometry.drawRange.count).toBe(system.getActiveCount())
        expect(system.geometry.attributes.position.array.every(Number.isFinite)).toBe(true)
      }
    } finally {
      manager.dispose()
    }
  }, 30_000)

  it('rejects traversal-shaped IDs before importing', async () => {
    const manager = createManager()
    try {
      for (const id of [
        '../../main',
        '../presets/sphere',
        '%2e%2e%2fmain',
        'sphere/../../main',
        'constructor',
        '__proto__',
        'SPHERE',
        ''
      ]) {
        await expect(manager.loadPreset(id)).rejects.toThrow('Unknown environment preset')
      }
      expect(manager.getAvailableEnvironments()).toHaveLength?.(0)
      expect(manager.getAvailableEnvironments().size).toBe(0)
    } finally {
      manager.dispose()
    }
  })

  it('completes a comfortable transition and applies speed to updates', async () => {
    const manager = createManager(0.5)
    try {
      await manager.switchEnvironment('sphere', { immediate: true })
      const before = manager.getParticleSystem().time
      manager.update(0.1)
      expect(manager.getParticleSystem().time - before).toBeCloseTo(0.05)

      await manager.loadPreset('nebula')
      const transition = manager.switchEnvironment('nebula')
      expect(manager.isTransitioning()).toBe(true)
      for (let index = 0; index < 10; index++) {
        manager.update(0.1)
      }
      await expect(transition).resolves.toBe(true)
      expect(manager.isTransitioning()).toBe(false)
      expect(manager.getCurrentEnvironment().id).toBe('nebula')
      expect(manager.fadeMesh.visible).toBe(false)
    } finally {
      manager.dispose()
    }
  })

  it('keeps CPU and GPU active counts synchronized during quality changes', async () => {
    const manager = createManager()
    try {
      await manager.switchEnvironment('sphere', { immediate: true })
      const system = manager.getParticleSystem()
      const original = system.getActiveCount()
      const reduced = system.reduceParticleCount(0.25, 100)
      expect(reduced).toBeLessThan(original)
      expect(system.geometry.drawRange.count).toBe(reduced)
      const restored = system.restoreParticleCount(1)
      expect(restored).toBe(original)
      expect(system.geometry.drawRange.count).toBe(original)
    } finally {
      manager.dispose()
    }
  })

  it('queues transitions, supersedes stale requests, and emits status changes', async () => {
    const manager = createManager()
    const statuses = []
    const environments = []
    manager.onTransitionChange = status => statuses.push(status.state)
    manager.onEnvironmentChange = environment => environments.push(environment.id)
    try {
      await manager.switchEnvironment('sphere', { immediate: true })
      await Promise.all([
        manager.loadPreset('nebula'),
        manager.loadPreset('galaxy'),
        manager.loadPreset('ocean')
      ])

      const first = manager.switchEnvironment('nebula')
      const superseded = manager.switchEnvironment('galaxy')
      const queued = manager.switchEnvironment('ocean')
      await expect(superseded).resolves.toBe(false)
      for (let index = 0; index < 20; index++) manager.update(0.1)
      await expect(first).resolves.toBe(true)
      await expect(queued).resolves.toBe(true)
      expect(manager.getCurrentEnvironment().id).toBe('ocean')
      expect(statuses).toContain('fadeOut')
      expect(statuses).toContain('fadeIn')
      expect(environments).toEqual(['sphere', 'nebula', 'ocean'])
    } finally {
      manager.dispose()
    }
  })

  it('cancels active and queued transitions, optionally jumping to the target', async () => {
    const manager = createManager()
    try {
      await manager.switchEnvironment('sphere', { immediate: true })
      await Promise.all([manager.loadPreset('nebula'), manager.loadPreset('galaxy')])
      const active = manager.switchEnvironment('nebula')
      const queued = manager.switchEnvironment('galaxy')
      expect(manager.cancelTransition({ jumpToTarget: true })).toBe(true)
      await expect(active).resolves.toBe(false)
      await expect(queued).resolves.toBe(false)
      expect(manager.getCurrentEnvironment().id).toBe('nebula')
      expect(manager.cancelTransition()).toBe(false)
    } finally {
      manager.dispose()
    }
  })

  it('rejects transition failures and all use after disposal', async () => {
    const manager = createManager()
    await manager.switchEnvironment('sphere', { immediate: true })
    await Promise.all([manager.loadPreset('nebula'), manager.loadPreset('galaxy')])

    const active = manager.switchEnvironment('nebula')
    const queued = manager.switchEnvironment('galaxy')
    manager.activateEnvironment = () => {
      throw new Error('synthetic activation failure')
    }
    for (let index = 0; index < 4; index++) manager.update(0.1)
    await expect(active).rejects.toThrow('synthetic activation failure')
    await expect(queued).rejects.toThrow('synthetic activation failure')
    expect(manager.isTransitioning()).toBe(false)

    manager.dispose()
    manager.dispose()
    expect(() => manager.assertUsable()).toThrow('disposed')
    await expect(manager.loadPreset('sphere')).rejects.toThrow('disposed')
    await expect(manager.switchEnvironment('sphere')).rejects.toThrow('disposed')

    const empty = createManager()
    expect(() => empty.initializeParticleSystem()).toThrow('No environment set')
    empty.update(0.1)
    empty.dispose()
  })
})

function createManager(speed = 1) {
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera()
  const speedControl = new SpeedControl({
    initialSpeed: speed,
    storage: { getItem: () => null, setItem: () => {} }
  })
  return new EnvironmentManager(
    scene,
    camera,
    {},
    new SeededRandom(12345),
    speedControl
  )
}
