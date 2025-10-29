// Lattice environment preset - Pulsing grid with spring physics
// Particles anchored to 3D grid points, gentle breathing oscillation

import * as THREE from 'three'

/**
 * Lattice Environment
 *
 * 3D cubic grid with particles anchored to lattice points via spring forces.
 * Particles drift from their anchor points and are pulled back, creating
 * a gentle breathing/pulsing effect. Pure Hooke's law physics.
 *
 * Visual: Neon CMY colors
 * Behavior: Spring physics anchored to grid (NO flocking)
 * Effect: Synchronized breathing/pulsing grid
 */

let gridIndex = 0

function latticeInitialization(rng, palette, bounds) {
  const rand = () => rng ? rng.random() : Math.random()

  // Grid dimensions (9×9×9 = 729)
  const gridSize = 9
  const totalParticles = gridSize * gridSize * gridSize

  const i = gridIndex % gridSize
  const j = Math.floor(gridIndex / gridSize) % gridSize
  const k = Math.floor(gridIndex / (gridSize * gridSize))
  gridIndex = (gridIndex + 1) % totalParticles

  // Grid spacing
  const spacing = 20.0 / (gridSize - 1)
  const baseX = (i - (gridSize - 1) / 2) * spacing
  const baseY = (j - (gridSize - 1) / 2) * spacing
  const baseZ = (k - (gridSize - 1) / 2) * spacing

  // Anchor point (home position)
  const anchorPoint = new THREE.Vector3(baseX, baseY, baseZ)

  // Start with jitter
  const jitter = 1.5
  const position = new THREE.Vector3(
    baseX + (rand() - 0.5) * jitter,
    baseY + (rand() - 0.5) * jitter,
    baseZ + (rand() - 0.5) * jitter
  )

  // Random initial velocity
  const velocity = new THREE.Vector3(
    (rand() - 0.5) * 0.5,
    (rand() - 0.5) * 0.5,
    (rand() - 0.5) * 0.5
  )

  // Neon CMY colors
  const colors = ['#00FFFF', '#FF00FF', '#FFFF00', '#00FF88', '#FF0088', '#88FF00']
  const colorIndex = Math.floor(rand() * colors.length)
  const color = new THREE.Color(colors[colorIndex])

  // Grid vertices larger
  const isVertex = (i === 0 || i === gridSize - 1) &&
                   (j === 0 || j === gridSize - 1) &&
                   (k === 0 || k === gridSize - 1)
  const size = isVertex ? 6 : rand() * 2 + 3 // 3-5 normally, 6 for corners

  return { position, velocity, color, size, anchorPoint }
}

const latticeEnvironment = {
  id: 'lattice',
  name: 'Lattice',
  description: 'Pulsing geometric grid - spring physics',

  spatial: {
    type: 'lattice',
    particleCount: 729, // 9×9×9
    bounds: {
      innerRadius: 5,
      outerRadius: 20
    },
    initializationFn: latticeInitialization
  },

  // Spring physics (NO flocking)
  behavior: {
    mode: 'spring',

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

    // Spring physics parameters
    modeParams: {
      springConstant: 3.0,     // Strong pull to grid points
      damping: 0.92,           // Strong damping for gentle oscillation
      maxForce: 15.0           // Prevent extreme forces
    }
  },

  visual: {
    renderMode: 'points',
    colorPalette: [
      '#00FFFF',  // Cyan
      '#FF00FF',  // Magenta
      '#FFFF00',  // Yellow
      '#00FF88',  // Spring green
      '#FF0088',  // Deep pink
      '#88FF00'   // Chartreuse
    ],
    particleSize: 4,           // Medium-large for visibility
    opacity: 0.85,             // Mostly opaque
    sizeAttenuation: false     // Constant size
  },

  performance: {
    targetFPS: 72,
    minFPS: 65,
    adaptiveQuality: true
  }
}

export default latticeEnvironment
