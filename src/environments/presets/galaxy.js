// Galaxy environment preset - Orbital mechanics with spiral distribution
// Pure gravitational physics - particles orbit galactic center

import * as THREE from 'three'

/**
 * Galaxy Environment
 *
 * Particles orbit around central mass using real gravitational physics.
 * Distributed in spiral arms but behavior is pure Newtonian mechanics.
 * Faster orbits near center, slower at edges (Kepler's laws).
 *
 * Visual: Small bright points (stars)
 * Behavior: Gravitational orbital mechanics (NO flocking)
 * Colors: Star colors (blue=young, white=main, yellow=old)
 */

function galaxyInitialization(rng, palette, bounds) {
  const rand = () => rng ? rng.random() : Math.random()

  // Spiral arm distribution
  const numArms = 3
  const armIndex = Math.floor(rand() * numArms)
  const armAngleOffset = (armIndex * Math.PI * 2) / numArms

  // Logarithmic spiral
  const a = 3.0
  const b = 0.15
  const theta = rand() * Math.PI * 4 + armAngleOffset
  let r = a * Math.exp(b * theta)
  r += (rand() - 0.5) * 2.0
  r = Math.max(bounds.innerRadius, Math.min(bounds.outerRadius, r))

  // Thin disk
  const z = (rand() - 0.5) * 3.0

  const x = r * Math.cos(theta)
  const y = r * Math.sin(theta)
  const position = new THREE.Vector3(x, y, z)

  // Orbital velocity (tangent to radius)
  // v = sqrt(GM/r) for circular orbit
  const orbitalSpeed = Math.sqrt(50.0 / (r + 1.0)) // sqrt(GM/r)
  const tangentAngle = theta + Math.PI / 2

  const velocity = new THREE.Vector3(
    orbitalSpeed * Math.cos(tangentAngle),
    orbitalSpeed * Math.sin(tangentAngle),
    (rand() - 0.5) * 0.1 // Minimal vertical motion
  )

  // Color: Hotter (bluer) stars near center, cooler (yellower) at edges
  const colors = ['#1E90FF', '#87CEEB', '#FFFFFF', '#F0E68C', '#FFD700', '#FFA500']
  const colorIndex = Math.floor(rand() * colors.length)
  const color = new THREE.Color(colors[colorIndex])

  const size = rand() * 2 + 2 // 2-4 range

  return { position, velocity, color, size }
}

const galaxyEnvironment = {
  id: 'galaxy',
  name: 'Galaxy',
  description: 'Gravitational orbits - Newtonian physics',

  spatial: {
    type: 'custom',
    particleCount: 1000,
    bounds: {
      innerRadius: 5,
      outerRadius: 20
    },
    initializationFn: galaxyInitialization
  },

  // Orbital mechanics (NO flocking)
  behavior: {
    mode: 'orbital',

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

    // Orbital mechanics parameters
    modeParams: {
      centerOfMass: new THREE.Vector3(0, 0, 0),
      gravitationalConstant: 50.0,   // Tuned for visible orbital motion
      centralMass: 1.0,
      dragCoefficient: 0.9999         // Very slight drag for stability
    }
  },

  visual: {
    renderMode: 'points',
    colorPalette: [
      '#1E90FF',  // Dodger blue (hot young stars)
      '#87CEEB',  // Sky blue
      '#FFFFFF',  // White (main sequence)
      '#F0E68C',  // Khaki
      '#FFD700',  // Gold
      '#FFA500'   // Orange (cool giants)
    ],
    particleSize: 2.5,         // Smaller (stars are distant points)
    opacity: 0.9,              // Bright stars
    sizeAttenuation: true      // Distance-based size
  },

  performance: {
    targetFPS: 72,
    minFPS: 65,
    adaptiveQuality: true
  }
}

export default galaxyEnvironment
