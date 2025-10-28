// Individual particle with position, velocity, color, and size
import * as THREE from 'three'
import { pickColorFromPalette } from '../utils/colors.js'

export class Particle {
  /**
   * Create a particle with random properties
   * @param {Object} bounds - {minX, maxX, minY, maxY} for 2D or {innerRadius, outerRadius} for 3D spherical
   * @param {SeededRandom} rng - Optional seeded random number generator
   * @param {THREE.Color[]} palette - Optional color palette to pick from
   */
  constructor(bounds, rng = null, palette = null) {
    // Use seeded RNG if provided, otherwise Math.random()
    const rand = () => rng ? rng.random() : Math.random()

    // Check if bounds are spherical (3D) or planar (2D)
    const isSpherical = bounds.innerRadius !== undefined && bounds.outerRadius !== undefined

    if (isSpherical) {
      // Spherical initialization: Distribute particles in 3D spherical volume
      // Use spherical coordinates (r, theta, phi) then convert to Cartesian (x, y, z)

      // Random radius between inner and outer radius
      const r = rand() * (bounds.outerRadius - bounds.innerRadius) + bounds.innerRadius

      // Random azimuth angle (theta): 0 to 2π (full rotation around Z axis)
      const theta = rand() * Math.PI * 2

      // Random polar angle (phi): 0 to π (from north to south pole)
      const phi = rand() * Math.PI

      // Convert spherical to Cartesian coordinates
      // x = r * sin(phi) * cos(theta)
      // y = r * sin(phi) * sin(theta)
      // z = r * cos(phi)
      this.position = new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      )

      // Velocity (Vector3) - 3D random values for spatial motion
      this.velocity = new THREE.Vector3(
        (rand() - 0.5) * 1.0, // -0.5 to 0.5 units per second
        (rand() - 0.5) * 1.0,
        (rand() - 0.5) * 1.0  // Include Z velocity for 3D motion
      )
    } else {
      // Planar initialization: 2D rectangle (backward compatibility)
      this.position = new THREE.Vector3(
        rand() * (bounds.maxX - bounds.minX) + bounds.minX,
        rand() * (bounds.maxY - bounds.minY) + bounds.minY,
        0 // Z = 0 for 2D-style orthographic view
      )

      // Velocity (Vector3) - 2D motion only
      this.velocity = new THREE.Vector3(
        (rand() - 0.5) * 1.0, // -0.5 to 0.5 units per second
        (rand() - 0.5) * 1.0,
        0
      )
    }

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
    // Frame-rate independent movement (3D)
    this.position.x += this.velocity.x * delta
    this.position.y += this.velocity.y * delta
    this.position.z += this.velocity.z * delta
  }
}
