// Vortex environment preset - Centripetal flow field
// Swirling tornado with rotational forces and upward spiral

import * as THREE from 'three'

/**
 * Vortex Environment
 *
 * Swirling vortex/tornado with centripetal flow field physics.
 * Particles rotate around vertical axis with speed inversely proportional
 * to radius. Upward drift creates spiral funnel effect.
 *
 * Visual: Fire/energy colors
 * Behavior: Centripetal flow field (NO flocking)
 * Effect: Dynamic swirling tornado
 */

function vortexInitialization(rng, palette, bounds) {
  const rand = () => rng ? rng.random() : Math.random()

  // Cylindrical distribution
  const rMax = 15.0
  const r = Math.sqrt(rand()) * rMax // Denser near center
  const theta = rand() * Math.PI * 2
  const y = (rand() - 0.5) * 25.0

  const x = r * Math.cos(theta)
  const z = r * Math.sin(theta)
  const position = new THREE.Vector3(x, y, z)

  // Initial tangential velocity
  const angularSpeed = 2.0 / (r + 0.5)
  const tangentAngle = theta + Math.PI / 2

  const velocity = new THREE.Vector3(
    angularSpeed * Math.cos(tangentAngle),
    0.3, // Initial upward drift
    angularSpeed * Math.sin(tangentAngle)
  )

  // Fire/energy colors
  const colors = ['#FF4500', '#FF6347', '#FFA500', '#FFD700', '#FF8C00', '#FF7F50']
  const colorIndex = Math.floor(rand() * colors.length)
  const color = new THREE.Color(colors[colorIndex])

  // Brighter near center
  const size = Math.max(2, 5 - r * 0.2)

  return { position, velocity, color, size }
}

const vortexEnvironment = {
  id: 'vortex',
  name: 'Vortex',
  description: 'Swirling tornado - centripetal flow field',

  spatial: {
    type: 'vortex',
    particleCount: 1000,
    bounds: {
      innerRadius: 5,
      outerRadius: 20
    },
    initializationFn: vortexInitialization
  },

  // Flow field behavior (NO flocking)
  behavior: {
    mode: 'flow',

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

    // Flow field parameters
    modeParams: {
      vortexAxis: new THREE.Vector3(0, 1, 0), // Y-axis (vertical)
      rotationSpeed: 3.0,                      // Fast rotation
      centripetalStrength: 0.8,                // Pull toward axis
      upwardDrift: 0.7                         // Upward spiral
    }
  },

  visual: {
    renderMode: 'points',
    colorPalette: [
      '#FF4500',  // Orange red
      '#FF6347',  // Tomato
      '#FFA500',  // Orange
      '#FFD700',  // Gold
      '#FF8C00',  // Dark orange
      '#FF7F50'   // Coral
    ],
    particleSize: 3,
    opacity: 0.75,
    sizeAttenuation: true      // Size varies with distance
  },

  performance: {
    targetFPS: 72,
    minFPS: 65,
    adaptiveQuality: true
  }
}

export default vortexEnvironment
