// Individual particle with position, velocity, color, and size
import * as THREE from 'three'
import { pickColorFromPalette } from '../utils/colors.js'

export class Particle {
  /**
   * Create a particle with random properties
   * @param {Object} bounds - {minX, maxX, minY, maxY}
   * @param {SeededRandom} rng - Optional seeded random number generator
   * @param {THREE.Color[]} palette - Optional color palette to pick from
   */
  constructor(bounds, rng = null, palette = null) {
    // Use seeded RNG if provided, otherwise Math.random()
    const rand = () => rng ? rng.random() : Math.random()

    // Position (Vector3)
    this.position = new THREE.Vector3(
      rand() * (bounds.maxX - bounds.minX) + bounds.minX,
      rand() * (bounds.maxY - bounds.minY) + bounds.minY,
      0 // Z = 0 for 2D-style orthographic view
    )

    // Velocity (Vector3) - small random values for smooth motion
    this.velocity = new THREE.Vector3(
      (rand() - 0.5) * 1.0, // -0.5 to 0.5 units per second
      (rand() - 0.5) * 1.0,
      0
    )

    // Color - pick from palette if provided, otherwise random RGB
    if (palette && rng) {
      // Pick random color from palette using seeded RNG
      this.color = pickColorFromPalette(palette, rng)
    } else {
      // Fallback to random RGB (backward compatibility)
      this.color = new THREE.Color(
        rand(),
        rand(),
        rand()
      )
    }

    // Size in pixels (2-5 range for variation)
    this.size = rand() * 3 + 2 // 2 to 5 pixels
  }

  /**
   * Update particle position based on velocity and delta time
   * @param {number} delta - Time elapsed since last frame (seconds)
   */
  update(delta) {
    // Frame-rate independent movement
    this.position.x += this.velocity.x * delta
    this.position.y += this.velocity.y * delta
  }
}
