const AUDIO_PROFILES = Object.freeze({
  sphere: { frequency: 110, overtone: 164.81, filter: 700 },
  nebula: { frequency: 73.42, overtone: 110, filter: 420 },
  galaxy: { frequency: 55, overtone: 82.41, filter: 520 },
  lattice: { frequency: 146.83, overtone: 220, filter: 1200 },
  vortex: { frequency: 82.41, overtone: 123.47, filter: 850 },
  ocean: { frequency: 65.41, overtone: 98, filter: 380 },
  hypercube: { frequency: 174.61, overtone: 261.63, filter: 1600 }
})

export class AudioManager {
  constructor(options = {}) {
    this.storage = Object.hasOwn(options, 'storage')
      ? options.storage
      : getSafeLocalStorage()
    this.storageKey = 'opwv_audio_enabled'
    this.context = null
    this.masterGain = null
    this.filter = null
    this.overtoneGain = null
    this.oscillators = []
    this.currentEnvironmentId = 'sphere'
    this.enabled = typeof options.initialEnabled === 'boolean'
      ? options.initialEnabled
      : this.loadPreference()
    this.requestedEnabled = this.enabled
    this.stateRequestId = 0
    this.onStateChange = null
  }

  isEnabled() {
    return this.enabled
  }

  isActive() {
    return this.enabled && this.context?.state === 'running'
  }

  async setEnabled(enabled) {
    const nextEnabled = Boolean(enabled)
    const requestId = ++this.stateRequestId
    this.requestedEnabled = nextEnabled

    try {
      if (nextEnabled) {
        await this.ensureAudioGraph()
        await this.context.resume()
      }
    } catch (error) {
      if (requestId === this.stateRequestId) {
        this.requestedEnabled = this.enabled
      }
      throw error
    }

    // A newer toggle superseded this asynchronous request.
    if (requestId !== this.stateRequestId) {
      return this.enabled
    }

    this.enabled = nextEnabled
    this.savePreference()
    this.applyGain()
    this.onStateChange?.(this.enabled)
    return this.enabled
  }

  async toggle() {
    return this.setEnabled(!this.requestedEnabled)
  }

  setEnvironment(environmentId) {
    if (!AUDIO_PROFILES[environmentId]) {
      return false
    }

    this.currentEnvironmentId = environmentId
    this.applyProfile()
    return true
  }

  async ensureAudioGraph() {
    if (this.context) {
      return
    }

    const AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext
    if (!AudioContextClass) {
      throw new Error('Web Audio is unavailable in this browser')
    }

    const context = new AudioContextClass()
    this.context = context

    try {
      this.masterGain = context.createGain()
      this.masterGain.gain.value = 0

      this.filter = context.createBiquadFilter()
      this.filter.type = 'lowpass'
      this.filter.Q.value = 0.7
      this.filter.connect(this.masterGain)
      this.masterGain.connect(context.destination)

      const primary = context.createOscillator()
      primary.type = 'sine'
      primary.connect(this.filter)

      this.overtoneGain = context.createGain()
      this.overtoneGain.gain.value = 0.18
      this.overtoneGain.connect(this.filter)

      const overtone = context.createOscillator()
      overtone.type = 'triangle'
      overtone.connect(this.overtoneGain)

      this.oscillators = [primary, overtone]
      primary.start()
      overtone.start()
      this.applyProfile(true)
    } catch (error) {
      await this.releaseAudioGraph()
      throw error
    }
  }

  applyProfile(immediate = false) {
    if (!this.context || this.oscillators.length < 2) {
      return
    }

    const profile = AUDIO_PROFILES[this.currentEnvironmentId]
    const now = this.context.currentTime
    const end = immediate ? now : now + 0.8
    setAudioParam(this.oscillators[0].frequency, profile.frequency, now, end)
    setAudioParam(this.oscillators[1].frequency, profile.overtone, now, end)
    setAudioParam(this.filter.frequency, profile.filter, now, end)
  }

  applyGain() {
    if (!this.context || !this.masterGain) {
      return
    }

    const now = this.context.currentTime
    setAudioParam(this.masterGain.gain, this.enabled ? 0.035 : 0, now, now + 0.4)
  }

  loadPreference() {
    try {
      return this.storage?.getItem(this.storageKey) === '1'
    } catch {
      return false
    }
  }

  savePreference() {
    try {
      this.storage?.setItem(this.storageKey, this.enabled ? '1' : '0')
    } catch {
      // Preference persistence is optional.
    }
  }

  async dispose() {
    this.stateRequestId++
    this.requestedEnabled = false
    this.enabled = false
    this.onStateChange = null
    await this.releaseAudioGraph()
  }

  async releaseAudioGraph() {
    for (const oscillator of this.oscillators) {
      try {
        oscillator.stop()
        oscillator.disconnect()
      } catch {
        // Already stopped or disconnected.
      }
    }

    this.oscillators = []
    this.overtoneGain?.disconnect()
    this.filter?.disconnect()
    this.masterGain?.disconnect()

    if (this.context && this.context.state !== 'closed') {
      try {
        await this.context.close()
      } catch (error) {
        console.warn('Unable to close audio context:', error)
      }
    }

    this.context = null
    this.filter = null
    this.masterGain = null
    this.overtoneGain = null
  }
}

function setAudioParam(parameter, value, startTime, endTime) {
  parameter.cancelScheduledValues(startTime)
  parameter.setValueAtTime(parameter.value, startTime)
  parameter.linearRampToValueAtTime(value, endTime)
}

function getSafeLocalStorage() {
  try {
    return globalThis.localStorage
  } catch {
    return null
  }
}
