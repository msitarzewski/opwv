import * as THREE from 'three'
import { describe, expect, it, vi } from 'vitest'
import { AudioManager } from '../../src/audio/AudioManager.js'
import { ParticleInteraction } from '../../src/interaction/ParticleInteraction.js'

describe('AudioManager', () => {
  it('loads, persists, and ignores unknown environment profiles', async () => {
    const storage = {
      getItem: vi.fn(() => '1'),
      setItem: vi.fn()
    }
    const restoreAudio = installAudioContext()
    const audio = new AudioManager({ storage })

    try {
      expect(audio.isEnabled()).toBe(true)
      expect(audio.setEnvironment('galaxy')).toBe(true)
      expect(audio.setEnvironment('../../main')).toBe(false)
      await audio.setEnabled(true)
      expect(audio.context.resume).toHaveBeenCalledOnce()
      expect(storage.setItem).toHaveBeenCalledWith('opwv_audio_enabled', '1')
      await audio.toggle()
      expect(audio.isEnabled()).toBe(false)
    } finally {
      await audio.dispose()
      restoreAudio()
    }
  })

  it('reports unavailable Web Audio without persisting an enabled state', async () => {
    const original = globalThis.AudioContext
    delete globalThis.AudioContext
    delete globalThis.webkitAudioContext
    const audio = new AudioManager({
      storage: { getItem: () => null, setItem: vi.fn() }
    })
    await expect(audio.setEnabled(true)).rejects.toThrow('Web Audio is unavailable')
    expect(audio.isEnabled()).toBe(false)
    globalThis.AudioContext = original
  })
})

describe('ParticleInteraction', () => {
  it('emits pinch attraction, open-hand repulsion, and a two-hand field', () => {
    const left = createHand({
      index: [0, 0, 0],
      thumb: [0.01, 0, 0],
      wrist: [0, -0.2, 0]
    })
    const right = createHand({
      index: [1, 0, 0],
      thumb: [1.01, 0, 0],
      wrist: [1, -0.2, 0]
    })
    const interaction = new ParticleInteraction({ hands: [left, right] })
    const sources = interaction.update({})

    expect(sources.filter(source => source.input === 'hand')).toHaveLength(2)
    expect(sources.find(source => source.input === 'two-hand')).toMatchObject({
      mode: 'attract',
      index: -1
    })
  })

  it('emits controller forces and clears sources when disabled', () => {
    const controller = new THREE.Object3D()
    controller.visible = true
    controller.position.set(1, 2, 3)
    controller.updateMatrixWorld(true)
    const controllerInput = {
      getControllers: () => [{
        index: 0,
        controller,
        gamepad: { buttons: [{ pressed: false }, { pressed: true }] }
      }]
    }
    const interaction = new ParticleInteraction({ controllerInput })
    expect(interaction.update({})[0]).toMatchObject({
      mode: 'repel',
      input: 'controller'
    })
    interaction.setEnabled(false)
    expect(interaction.update({})).toEqual([])
  })
})

function createHand({ index, thumb, wrist }) {
  return {
    joints: {
      'index-finger-tip': joint(index),
      'thumb-tip': joint(thumb),
      wrist: joint(wrist)
    }
  }
}

function joint(position) {
  return {
    visible: true,
    getWorldPosition(target) {
      return target.fromArray(position)
    }
  }
}

function installAudioContext() {
  const original = globalThis.AudioContext
  const parameter = () => ({
    value: 0,
    cancelScheduledValues: vi.fn(),
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn()
  })
  const node = () => ({
    connect: vi.fn(),
    disconnect: vi.fn()
  })
  class FakeAudioContext {
    constructor() {
      this.currentTime = 0
      this.destination = {}
      this.state = 'running'
      this.resume = vi.fn().mockResolvedValue(undefined)
      this.close = vi.fn().mockImplementation(async () => {
        this.state = 'closed'
      })
    }

    createGain() {
      return { ...node(), gain: parameter() }
    }

    createBiquadFilter() {
      return { ...node(), frequency: parameter(), Q: { value: 0 } }
    }

    createOscillator() {
      return {
        ...node(),
        frequency: parameter(),
        start: vi.fn(),
        stop: vi.fn()
      }
    }
  }
  globalThis.AudioContext = FakeAudioContext
  return () => {
    globalThis.AudioContext = original
  }
}
