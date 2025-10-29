// Hypercube environment preset - 4D rotation with rainbow trails
// Pure 4D tesseract rotation projected to 3D space

import * as THREE from 'three'
import { Vector4D } from '../../particles/behaviors/rotation.js'

/**
 * Hypercube (Tesseract) Environment
 *
 * 4D hypercube edges rotating continuously in 4D space and projected to 3D.
 * Pure geometric transformation - NO physics simulation. Creates mesmerizing
 * morphing patterns as 4D structure rotates through 3D projection.
 *
 * Visual: Rainbow spectrum gradient
 * Behavior: Pure 4D rotation (NO flocking)
 * Effect: Mind-bending 4D geometry visualization
 */

/**
 * Generate 16 vertices of a tesseract
 */
function getTesseractVertices() {
  const vertices = []
  const scale = 5.0
  for (let i = 0; i < 16; i++) {
    const x = (i & 1) ? 1 : -1
    const y = (i & 2) ? 1 : -1
    const z = (i & 4) ? 1 : -1
    const w = (i & 8) ? 1 : -1
    vertices.push(new Vector4D(x * scale, y * scale, z * scale, w * scale))
  }
  return vertices
}

/**
 * Get all 32 edges of a tesseract
 */
function getTesseractEdges() {
  const edges = []
  for (let i = 0; i < 16; i++) {
    for (let j = i + 1; j < 16; j++) {
      const diff = i ^ j
      const bitCount = diff.toString(2).split('1').length - 1
      if (bitCount === 1) {
        edges.push([i, j])
      }
    }
  }
  return edges
}

function hypercubeInitialization(rng, palette, bounds) {
  const rand = () => rng ? rng.random() : Math.random()

  const vertices = getTesseractVertices()
  const edges = getTesseractEdges()

  // Pick random edge
  const edgeIndex = Math.floor(rand() * edges.length)
  const [v1Index, v2Index] = edges[edgeIndex]

  // Position along edge
  const t = rand()
  const v1 = vertices[v1Index]
  const v2 = vertices[v2Index]

  // Interpolate in 4D
  const point4D = new Vector4D(
    v1.x + (v2.x - v1.x) * t,
    v1.y + (v2.y - v1.y) * t,
    v1.z + (v2.z - v1.z) * t,
    v1.w + (v2.w - v1.w) * t
  )

  // Project to 3D
  const position = point4D.projectTo3D(2.5)

  // Velocity will be calculated by rotation behavior
  const velocity = new THREE.Vector3(0, 0, 0)

  // Rainbow hue based on 4D W coordinate
  const hue = ((point4D.w + 5) / 10 + edgeIndex * 0.05) % 1.0
  const color = new THREE.Color().setHSL(hue, 1.0, 0.6)

  const size = rand() * 2 + 2.5 // 2.5-4.5

  // Store 4D position for rotation behavior
  return { position, velocity, color, size, rotation4D: point4D }
}

const hypercubeEnvironment = {
  id: 'hypercube',
  name: 'Hypercube',
  description: '4D tesseract rotation - rainbow geometry',

  spatial: {
    type: 'custom',
    particleCount: 800,
    bounds: {
      innerRadius: 5,
      outerRadius: 20
    },
    initializationFn: hypercubeInitialization
  },

  // Pure 4D rotation (NO flocking)
  behavior: {
    mode: 'rotation',

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

    // 4D rotation parameters
    modeParams: {
      rotationSpeedXW: 0.3,      // XW plane rotation
      rotationSpeedYW: 0.2,      // YW plane rotation
      rotationSpeedZW: 0.15,     // ZW plane rotation
      projectionDistance: 2.5    // 4D projection distance
    }
  },

  visual: {
    renderMode: 'points',
    colorPalette: null,          // Rainbow hue rotation (handled in initFn)
    particleSize: 3,
    opacity: 0.8,
    sizeAttenuation: true
  },

  performance: {
    targetFPS: 72,
    minFPS: 65,
    adaptiveQuality: true
  }
}

export default hypercubeEnvironment
