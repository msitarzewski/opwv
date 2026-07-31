import { describe, expect, it, vi } from 'vitest'
import {
  SeededRandom,
  deriveSeed,
  generateSeed,
  getSeedFromURL
} from '../../src/utils/random.js'
import {
  copySceneURL,
  getEnvironmentIds,
  isEnvironmentId,
  parseSceneState,
  updateSceneURL
} from '../../src/utils/sceneState.js'

describe('seeded randomization', () => {
  it('replays the same sequence and creates stable derived streams', () => {
    const first = new SeededRandom(12345)
    const second = new SeededRandom(12345)

    expect(Array.from({ length: 10 }, () => first.random()))
      .toEqual(Array.from({ length: 10 }, () => second.random()))
    expect(first.derive('galaxy').getSeed()).toBe(deriveSeed(12345, 'galaxy'))
    expect(first.derive('galaxy').random()).toBe(second.derive('galaxy').random())
  })

  it('keeps integer and float values inside half-open ranges', () => {
    const rng = new SeededRandom(7)
    for (let index = 0; index < 100; index++) {
      expect(rng.randomInt(-2, 4)).toBeGreaterThanOrEqual(-2)
      expect(rng.randomInt(-2, 4)).toBeLessThan(4)
      expect(rng.randomFloat(0.25, 2)).toBeGreaterThanOrEqual(0.25)
      expect(rng.randomFloat(0.25, 2)).toBeLessThan(2)
    }
  })

  it('resets safely and rejects non-integer seed material', () => {
    const rng = new SeededRandom(99)
    const initial = rng.random()
    rng.reset()
    expect(rng.random()).toBe(initial)
    expect(() => rng.reset(Number.NaN)).toThrow(TypeError)
    expect(() => deriveSeed(Number.POSITIVE_INFINITY, 'sphere')).toThrow(TypeError)
  })

  it.each([
    ['', null],
    ['?seed=0', 0],
    ['?seed=4294967295', 4294967295],
    ['?seed=-1', null],
    ['?seed=4294967296', null],
    ['?seed=12junk', null],
    ['?seed=Infinity', null],
    [`?seed=${'9'.repeat(1000)}`, null]
  ])('strictly parses %s', (search, expected) => {
    window.history.replaceState({}, '', `/${search}`)
    expect(getSeedFromURL()).toBe(expected)
  })

  it('generates a normalized timestamp seed', () => {
    vi.spyOn(Date, 'now').mockReturnValue(0x1_0000_0001)
    expect(generateSeed()).toBe(1)
  })
})

describe('shareable scene state', () => {
  it('exposes a defensive environment allowlist', () => {
    const ids = getEnvironmentIds()
    expect(ids).toEqual([
      'sphere', 'nebula', 'galaxy', 'lattice', 'vortex', 'ocean', 'hypercube'
    ])
    ids.pop()
    expect(getEnvironmentIds()).toHaveLength(7)
    expect(isEnvironmentId('sphere')).toBe(true)
    expect(isEnvironmentId('../main')).toBe(false)
    expect(isEnvironmentId('__proto__')).toBe(false)
  })

  it('parses valid values and falls back for hostile values', () => {
    expect(parseSceneState('?env=galaxy&seed=42&speed=1.5&audio=true')).toEqual({
      environmentId: 'galaxy',
      seed: 42,
      speed: 1.5,
      audioEnabled: true
    })

    expect(parseSceneState(
      '?env=../../main&seed=12junk&speed=Infinity&audio=wat',
      { environmentId: 'ocean', seed: 9, speed: 0.5, audioEnabled: false }
    )).toEqual({
      environmentId: 'ocean',
      seed: 9,
      speed: 0.5,
      audioEnabled: false
    })
  })

  it('updates only bounded scene parameters', () => {
    window.history.replaceState({}, '', '/?unrelated=keep')
    const url = new URL(updateSceneURL({
      environmentId: 'vortex',
      seed: 123,
      speed: 0.25,
      audioEnabled: true
    }))

    expect(url.searchParams.get('env')).toBe('vortex')
    expect(url.searchParams.get('seed')).toBe('123')
    expect(url.searchParams.get('speed')).toBe('0.25')
    expect(url.searchParams.get('audio')).toBe('1')
    expect(url.searchParams.get('unrelated')).toBe('keep')
  })

  it('copies the canonical URL and reports unavailable clipboard access', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText }
    })

    await copySceneURL({
      environmentId: 'sphere',
      seed: 1,
      speed: 1,
      audioEnabled: false
    })
    expect(writeText).toHaveBeenCalledOnce()

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: undefined
    })
    await expect(copySceneURL({ environmentId: 'sphere' }))
      .rejects.toThrow('Clipboard access is unavailable')
  })
})
