// Sphere environment preset - Baseline spherical shell configuration
// Matches existing implementation from XR Test milestone

/**
 * Sphere Environment
 *
 * Baseline environment with particles distributed in a spherical shell
 * surrounding the viewer at origin. This matches the current implementation
 * from the XR Test milestone (360° immersive VR viewing).
 *
 * Spatial: Spherical shell (innerRadius: 5, outerRadius: 20)
 * Behavior: Balanced flocking with organic noise drift
 * Visual: Generated color palette, medium opacity, constant size
 * Performance: 72fps target for VR (Quest 2/3 baseline)
 */
const sphereEnvironment = {
  // Core metadata
  id: 'sphere',
  name: 'Sphere',
  description: 'Spherical shell of particles surrounding you - baseline environment',

  // Spatial configuration
  spatial: {
    type: 'spherical',
    particleCount: 1000,
    bounds: {
      innerRadius: 5,   // Minimum distance from origin
      outerRadius: 20   // Maximum distance from origin
    },
    initializationFn: null  // Use default Particle constructor (spherical distribution)
  },

  // Behavior parameters (from ParticleSystem.js:25-35)
  behavior: {
    mode: 'flocking',         // Classic flocking behavior (baseline)
    cohesionRadius: 2.0,      // Particles group within 2 units
    cohesionWeight: 0.05,     // Subtle cohesion force
    alignmentRadius: 2.0,     // Velocity alignment within 2 units
    alignmentWeight: 0.05,    // Subtle alignment force
    separationRadius: 1.0,    // Avoid particles within 1 unit
    separationWeight: 0.1,    // Moderate separation force
    maxSpeed: 2.0,            // Maximum velocity magnitude
    noiseScale: 0.5,          // Noise field spatial frequency (from ParticleSystem.js:38)
    noiseStrength: 0.3        // Noise force magnitude
  },

  // Visual aesthetics (from ParticleSystem.js:80-86)
  visual: {
    renderMode: 'points',     // Standard point particles (baseline)
    colorPalette: null,       // null = use generatePalette (seeded random colors)
    particleSize: 3,          // Base size in pixels
    opacity: 0.8,             // 80% opacity
    sizeAttenuation: false    // Constant size regardless of distance
  },

  // Performance targets (from main.js:136-137)
  performance: {
    targetFPS: 72,            // VR target (Quest baseline)
    minFPS: 65,               // Minimum before adaptive quality kicks in
    adaptiveQuality: true     // Enable automatic particle reduction if needed
  }
}

export default sphereEnvironment
