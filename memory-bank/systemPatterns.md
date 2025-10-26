# System Patterns

## Architecture Overview

This is a **client-side only** application with no backend. The core architecture follows a modular WebGL rendering pattern using Three.js.

## Core Components

### 1. Particle System
**Purpose**: Manage particle lifecycle, behavior, and rendering
**Pattern**: Entity-Component pattern
- Each particle has: position, velocity, color, size
- Behavior rules: flocking (cohesion, alignment, separation), noise, user attraction
- Rendering: Three.js Points or InstancedMesh for performance

### 2. Renderer
**Purpose**: WebGL context management and frame rendering
**Pattern**: Singleton renderer with scene/camera
- Initialize Three.js WebGLRenderer
- Manage scene, camera, lighting (if any)
- Responsive canvas sizing
- Performance monitoring (FPS)

### 3. Interaction Layer
**Purpose**: Capture mouse/touch input and translate to particle forces
**Pattern**: Event-driven input handling
- Mouse position tracking
- Touch position tracking (mobile)
- Debounced/throttled updates for performance
- Force calculation (attraction/repulsion)

### 4. Randomization System
**Purpose**: Seeded random generation for reproducible visuals
**Pattern**: Seed-based configuration
- Random seed on load (or URL parameter for sharing)
- Seed influences: color palette, particle count, motion constants
- Safe parameter ranges (min/max bounds)

### 5. Animation Loop
**Purpose**: Core update/render cycle
**Pattern**: requestAnimationFrame loop
```js
function animate() {
  requestAnimationFrame(animate)
  updateParticles(deltaTime)
  applyInteraction(mousePosition)
  renderer.render(scene, camera)
}
```

## Animation Behavior Patterns

### Organic Motion
- **Noise-driven**: Simplex/Perlin noise for smooth, natural drift
- **Flocking rules**: Craig Reynolds boids algorithm (cohesion, alignment, separation)
- **Bounded chaos**: Max speed limits, attraction clamping, wrap-around or soft bounds

### Visual Aesthetics
- **Color**: HSL-based for harmonious palettes (e.g., hue range from seed, high saturation, medium lightness)
- **Particle size**: Slight variation for depth perception
- **Motion**: Calm, dreamy, fluid — avoid jittery or aggressive movement

## Performance Patterns

### Adaptive Quality
- Monitor FPS every N frames
- If FPS < 50: reduce particle count by 10-20%
- If FPS > 58: can increase count (optional)
- Clamp devicePixelRatio for high-DPI screens

### Memory Safety
- Dispose Three.js geometries/materials on cleanup
- Use object pools for particles if recycling
- Clear event listeners on unmount

## Code Organization Patterns

### File Structure
```
src/
  particles/
    ParticleSystem.js      # Main particle management
    Particle.js            # Individual particle class
    behaviors.js           # Flocking, noise, attraction
  utils/
    random.js              # Seeded random utilities
    noise.js               # Simplex/Perlin noise
    colors.js              # Palette generation
  main.js                  # Entry, init, animate loop
```

### Module Pattern
- ES6 modules (import/export)
- Single responsibility per file
- Avoid global state (use closures or classes)

## Interaction Patterns

### Mouse/Touch Handling
```js
// Normalize coordinates to Three.js space
const mouse = {
  x: (event.clientX / window.innerWidth) * 2 - 1,
  y: -(event.clientY / window.innerHeight) * 2 + 1
}
// Apply force in particle update
const attraction = calculateAttraction(particle.position, mouse)
particle.velocity.add(attraction)
```

## Future Extension Points

- **Multi-mode**: Switch between different behavior rulesets
- **Audio-reactive**: Map audio frequency to color/motion
- **URL seed sharing**: `?seed=12345` for reproducible visuals
- **Performance presets**: Low/Medium/High quality settings
