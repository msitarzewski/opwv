const ENVIRONMENT_IDS = Object.freeze([
  'sphere',
  'nebula',
  'galaxy',
  'lattice',
  'vortex',
  'ocean',
  'hypercube'
])

const ENVIRONMENT_ID_SET = new Set(ENVIRONMENT_IDS)
const SPEED_MIN = 0.25
const SPEED_MAX = 2

export function getEnvironmentIds() {
  return [...ENVIRONMENT_IDS]
}

export function isEnvironmentId(value) {
  return typeof value === 'string' && ENVIRONMENT_ID_SET.has(value)
}

export function parseSceneState(search = getCurrentSearch(), defaults = {}) {
  const params = new URLSearchParams(search)
  const requestedEnvironment = params.get('env')
  const requestedSeed = params.get('seed')
  const requestedSpeed = params.get('speed')

  const seed = parseSeed(requestedSeed)
  const speed = parseSceneSpeed(requestedSpeed)

  return {
    environmentId: isEnvironmentId(requestedEnvironment)
      ? requestedEnvironment
      : defaults.environmentId || 'sphere',
    seed: seed ?? defaults.seed ?? null,
    speed: speed ?? defaults.speed ?? 1,
    audioEnabled: parseBoolean(params.get('audio'), defaults.audioEnabled ?? false)
  }
}

export function updateSceneURL(state, { replace = true } = {}) {
  if (typeof window === 'undefined') {
    throw new Error('Scene URL updates require a browser context')
  }

  const url = buildSceneURL(state, {
    baseURL: window.location.href,
    preserveExisting: true
  })

  const method = replace ? 'replaceState' : 'pushState'
  window.history[method]({}, '', url)
  return url.toString()
}

/**
 * Build a bounded scene URL without mutating browser history.
 * @param {Object} state
 * @param {Object} options
 * @param {string|URL} options.baseURL
 * @param {boolean} options.preserveExisting
 * @returns {URL}
 */
export function buildSceneURL(
  state,
  {
    baseURL = getCurrentURL(),
    preserveExisting = false
  } = {}
) {
  if (!state || typeof state !== 'object') {
    throw new TypeError('Scene state must be an object')
  }

  const url = new URL(baseURL)
  if (!preserveExisting) {
    url.search = ''
  }

  if (isEnvironmentId(state.environmentId)) {
    url.searchParams.set('env', state.environmentId)
  } else {
    url.searchParams.delete('env')
  }

  if (Number.isSafeInteger(state.seed) && state.seed >= 0 && state.seed <= 0xffffffff) {
    url.searchParams.set('seed', String(state.seed >>> 0))
  } else {
    url.searchParams.delete('seed')
  }

  if (Number.isFinite(state.speed) && state.speed >= SPEED_MIN && state.speed <= SPEED_MAX) {
    url.searchParams.set('speed', formatSpeed(state.speed))
  } else {
    url.searchParams.delete('speed')
  }

  if (state.audioEnabled) {
    url.searchParams.set('audio', '1')
  } else {
    url.searchParams.delete('audio')
  }

  return url
}

export async function copySceneURL(state) {
  const url = buildSceneURL(state)

  if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
    throw new Error('Clipboard access is unavailable')
  }

  const urlText = url.toString()
  await navigator.clipboard.writeText(urlText)
  return urlText
}

function parseSeed(value) {
  if (!value || value.length > 10 || !/^\d+$/.test(value)) {
    return null
  }

  const seed = Number(value)
  return Number.isSafeInteger(seed) && seed >= 0 && seed <= 0xffffffff
    ? seed >>> 0
    : null
}

export function parseSceneSpeed(value) {
  if (!value || value.length > 8 || !/^(?:\d+|\d+\.\d+)$/.test(value)) {
    return null
  }

  const speed = Number(value)
  return Number.isFinite(speed) && speed >= SPEED_MIN && speed <= SPEED_MAX
    ? speed
    : null
}

function parseBoolean(value, fallback) {
  if (value === '1' || value === 'true') return true
  if (value === '0' || value === 'false') return false
  return Boolean(fallback)
}

function formatSpeed(speed) {
  return Number(speed.toFixed(2)).toString()
}

function getCurrentSearch() {
  return typeof window === 'undefined' ? '' : window.location.search
}

function getCurrentURL() {
  if (typeof window === 'undefined') {
    throw new Error('A base URL is required outside a browser context')
  }
  return window.location.href
}
