// Nebula environment preset - Glowing orbs with Brownian motion
// Slow-drifting luminous spheres like deep space gas clouds

import * as THREE from 'three'

/**
 * Nebula Environment
 *
 * Glowing spherical particles with pure Brownian motion (random walk).
 * No flocking - just slow, organic drift like gas molecules in a nebula.
 * Larger, glowing particles create soft luminous cloud effect.
 *
 * Visual: Larger glowing particles (NOT standard points)
 * Behavior: Pure Brownian motion (random walk)
 * Colors: Deep space purples, blues, magentas
 */

function nebulaInitialization(rng, palette, bounds) {
  const rand = () => rng ? rng.random() : Math.random()

  // Random spherical position
  const r = rand() * (bounds.outerRadius - bounds.innerRadius) + bounds.innerRadius
  const theta = rand() * Math.PI * 2
  const phi = rand() * Math.PI

  const position = new THREE.Vector3(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.sin(phi) * Math.sin(theta),
    r * Math.cos(phi)
  )

  // Very slow initial velocity (Brownian motion will take over)
  const velocity = new THREE.Vector3(
    (rand() - 0.5) * 0.2,
    (rand() - 0.5) * 0.2,
    (rand() - 0.5) * 0.2
  )

  // Color from deep space palette
  const colors = ['#8B00FF', '#4B0082', '#FF00FF', '#9370DB', '#BA55D3', '#8A2BE2']
  const colorIndex = Math.floor(rand() * colors.length)
  const color = new THREE.Color(colors[colorIndex])

  // Larger particles for glowing nebula effect
  const size = rand() * 4 + 4 // 4-8 range (much larger than baseline)

  return { position, velocity, color, size }
}

const nebulaEnvironment = {
  id: 'nebula',
  name: 'Nebula',
  description: 'Glowing gas clouds - slow Brownian drift',

  spatial: {
    type: 'custom',
    particleCount: 800, // Fewer for larger particles
    bounds: {
      innerRadius: 5,
      outerRadius: 20
    },
    initializationFn: nebulaInitialization
  },

  // Brownian motion behavior (NO flocking)
  behavior: {
    mode: 'brownian',

    // Flocking params ignored in brownian mode (kept for schema compatibility)
    cohesionRadius: 0,
    cohesionWeight: 0,
    alignmentRadius: 0,
    alignmentWeight: 0,
    separationRadius: 0,
    separationWeight: 0,
    maxSpeed: 0,
    noiseScale: 0,
    noiseStrength: 0,

    // Brownian motion parameters
    modeParams: {
      speed: 0.3,              // Slow random motion
      damping: 0.97,           // Heavy damping for slow drift
      driftDirection: null,    // No directional drift
      driftStrength: 0
    }
  },

  // Visual: Larger glowing particles
  visual: {
    renderMode: 'points',      // Standard points (spheres would be too heavy)
    colorPalette: [
      '#8B00FF',  // Electric purple
      '#4B0082',  // Indigo
      '#FF00FF',  // Magenta
      '#9370DB',  // Medium purple
      '#BA55D3',  // Medium orchid
      '#8A2BE2'   // Blue violet
    ],
    particleSize: 6,           // Much larger than baseline (3)
    opacity: 0.6,              // More transparent for soft glow
    sizeAttenuation: true,     // Distance-based size for depth
    emissive: '#8B00FF',       // Purple glow (for future sphere renderer)
    emissiveIntensity: 0.8     // Strong glow
  },

  performance: {
    targetFPS: 72,
    minFPS: 65,
    adaptiveQuality: true
  }
}

export default nebulaEnvironment
