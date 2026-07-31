import { describe, expect, it, vi } from 'vitest'
import { PerformanceMonitor } from '../../src/utils/performance.js'
import { SpeedControl } from '../../src/controls/SpeedControl.js'

describe('PerformanceMonitor', () => {
  it('records finite frame samples and percentile metrics', () => {
    const monitor = new PerformanceMonitor({
      targetFPS: 72,
      minFPS: 65,
      checkInterval: 4
    })

    for (const timestamp of [0, 10, 20, 70, 70, -1, 1080]) {
      monitor.recordFrame(timestamp)
    }

    const metrics = monitor.getMetrics()
    expect(metrics.sampleCount).toBe(3)
    expect(metrics.p50FrameTime).toBe(10)
    expect(metrics.p95FrameTime).toBe(50)
    expect(metrics.longFrames).toBe(0)
    expect(Number.isFinite(metrics.averageFPS)).toBe(true)
    expect(monitor.shouldCheck()).toBe(true)
  })

  it('requires sustained slow or fast checks before changing quality', () => {
    const slow = new PerformanceMonitor({
      targetFPS: 72,
      minFPS: 65,
      degradeChecks: 2,
      recoverChecks: 2,
      cooldownChecks: 1
    })
    slow.recordFrame(0)
    slow.recordFrame(20)
    expect(slow.evaluateQuality()).toBeNull()
    expect(slow.evaluateQuality()).toBe('reduce')
    expect(slow.evaluateQuality()).toBeNull()

    const fast = new PerformanceMonitor({
      targetFPS: 72,
      minFPS: 65,
      recoverChecks: 2,
      cooldownChecks: 0
    })
    fast.recordFrame(0)
    fast.recordFrame(10)
    expect(fast.evaluateQuality()).toBeNull()
    expect(fast.evaluateQuality()).toBe('increase')
  })

  it('validates target changes and preserves the last timestamp on reset', () => {
    const monitor = new PerformanceMonitor()
    monitor.recordFrame(100)
    monitor.reset()
    monitor.recordFrame(116)
    expect(monitor.getMetrics().sampleCount).toBe(1)
    expect(() => monitor.setTargets({ targetFPS: 0, minFPS: 1 })).toThrow(TypeError)
    expect(() => monitor.setTargets({ targetFPS: 72, minFPS: 90 })).toThrow(TypeError)
    monitor.setTargets({ targetFPS: 90, minFPS: 72 })
    expect(monitor.targetFPS).toBe(90)
  })
})

describe('SpeedControl', () => {
  it('loads only strict persisted values and accepts bounded initial speed', () => {
    const validStorage = storageWith('1.5')
    expect(new SpeedControl({ storage: validStorage }).getCurrentSpeed()).toBe(1.5)
    expect(new SpeedControl({ storage: storageWith('1.5junk') }).getCurrentSpeed()).toBe(1)
    expect(new SpeedControl({ storage: storageWith('Infinity') }).getCurrentSpeed()).toBe(1)
    expect(new SpeedControl({ storage: storageWith(null), initialSpeed: 9 }).getCurrentSpeed()).toBe(2)
  })

  it('clamps, persists, eases, and completes exactly once', () => {
    const storage = storageWith(null)
    const speed = new SpeedControl({ storage, lerpDuration: 0.3 })
    speed.onSpeedChange = vi.fn()
    speed.onLerpComplete = vi.fn()

    expect(speed.setSpeed(8)).toBe(true)
    expect(speed.getTargetSpeed()).toBe(2)
    expect(storage.setItem).toHaveBeenCalledWith('opwv_speed_multiplier', '2')
    speed.update(0.15)
    expect(speed.getCurrentSpeed()).toBeCloseTo(1.5)
    speed.update(0.15)
    expect(speed.getCurrentSpeed()).toBe(2)
    expect(speed.onLerpComplete).toHaveBeenCalledOnce()
    expect(speed.setSpeed(2)).toBe(false)
  })

  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    'rejects non-finite speed %s',
    value => {
      const speed = new SpeedControl({ storage: storageWith(null) })
      expect(() => speed.setSpeed(value)).toThrow(TypeError)
    }
  )

  it('degrades gracefully when storage throws', () => {
    const storage = {
      getItem: vi.fn(() => { throw new Error('denied') }),
      setItem: vi.fn(() => { throw new Error('denied') })
    }
    const speed = new SpeedControl({ storage })
    expect(speed.getCurrentSpeed()).toBe(1)
    expect(() => speed.setSpeed(0.5)).not.toThrow()
  })
})

function storageWith(value) {
  return {
    getItem: vi.fn(() => value),
    setItem: vi.fn()
  }
}
