// Ocean environment preset - Wave equation dynamics
// Undulating horizontal plane with sine wave propagation

import * as THREE from 'three'

/**
 * Ocean Environment
 *
 * Horizontal plane of particles with wave equation physics.
 * Sine wave oscillations propagate across the surface creating
 * an undulating ocean effect.
 *
 * Visual: Aquatic blue/green colors
 * Behavior: Wave equation (NO flocking)
 * Effect: Undulating water surface
 */

function oceanInitialization(rng, palette, bounds) {
  const rand = () => rng ? rng.random() : Math.random()

  // Horizontal plane (XZ)
  const planeSize = 30.0
  const x = (rand() - 0.5) * planeSize
  const z = (rand() - 0.5) * planeSize

  // Initial wave height (will be controlled by wave behavior)
  const y = Math.sin(x * 0.3) * 2.0 + Math.sin(z * 0.4) * 1.5

  const position = new THREE.Vector3(x, y, z)

  // Initial velocity (wave propagation will take over)
  const velocity = new THREE.Vector3(
    0.5, // Slow drift in +X
    0,
    (rand() - 0.5) * 0.2
  )

  // Aquatic colors
  const colors = ['#0077BE', '#00CED1', '#20B2AA', '#48D1CC', '#40E0D0', '#5F9EA0']
  const colorIndex = Math.floor(rand() * colors.length)
  const color = new THREE.Color(colors[colorIndex])

  const size = rand() * 2 + 3 // 3-5 range

  return { position, velocity, color, size }
}

const oceanEnvironment = {
  id: 'ocean',
  name: 'Ocean',
  description: 'Undulating waves - wave equation physics',

  spatial: {
    type: 'custom',
    particleCount: 900,
    bounds: {
      innerRadius: 5,
      outerRadius: 20
    },
    initializationFn: oceanInitialization
  },

  // Wave dynamics (NO flocking)
  behavior: {
    mode: 'wave',

    // Flocking params ignored
    cohesionRadius: 0,
    cohesionWeight: 0,
    alignmentRadius: 0,
    alignmentWeight: 0,
    separationRadius: 0,
    separationWeight: 0,
    maxSpeed: 0,
    noiseScale: 0,
    noiseStrength: 0,

    // Wave propagation parameters
    modeParams: {
      waveSpeed: 1.5,                          // Wave propagation speed
      amplitude: 2.5,                          // Wave height
      frequency: 0.4,                          // Wave frequency
      waveDirection: new THREE.Vector3(1, 0, 0) // +X direction
    }
  },

  visual: {
    renderMode: 'points',
    colorPalette: [
      '#0077BE',  // Ocean blue
      '#00CED1',  // Dark turquoise
      '#20B2AA',  // Light sea green
      '#48D1CC',  // Medium turquoise
      '#40E0D0',  // Turquoise
      '#5F9EA0'   // Cadet blue
    ],
    particleSize: 4,
    opacity: 0.7,
    sizeAttenuation: false
  },

  performance: {
    targetFPS: 72,
    minFPS: 65,
    adaptiveQuality: true
  }
}

export default oceanEnvironment
