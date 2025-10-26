# Quick Start Guide

## Project: Organic Particle WebGL Visualizer (OPWV)

### What is this?
A browser-based generative art experience with organic particle animations using Three.js and WebGL.

### Quick Context
- **Goal**: Beautiful, unique particle animation every time you load it
- **Tech**: Three.js, Vite, JavaScript ES6+
- **Scope**: MVP (2-4 days) - single animation mode, no UI
- **Performance**: 60fps target, adaptive quality for mobile

---

## Development Commands (Future)

```bash
npm install          # Install dependencies
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

---

## Key Files to Know

### Source Code
- `src/main.js` - Entry point, initialization, render loop
- `src/particles/ParticleSystem.js` - Main particle management
- `src/particles/behaviors.js` - Flocking, noise, attraction logic
- `src/utils/random.js` - Seeded randomization
- `src/utils/noise.js` - Simplex/Perlin noise
- `src/utils/colors.js` - Palette generation

### Configuration
- `index.html` - HTML shell (minimal)
- `vite.config.js` - Build configuration
- `package.json` - Dependencies and scripts

### Documentation
- `README.md` - Project overview and setup
- `prd.md` - Product requirements
- `memory-bank/` - Architecture, decisions, progress

---

## Common Patterns

### Render Loop Structure
```js
function animate() {
  requestAnimationFrame(animate)

  const deltaTime = clock.getDelta()

  // Update particles
  particleSystem.update(deltaTime, mousePosition)

  // Render scene
  renderer.render(scene, camera)

  // Monitor performance
  stats.update()
}
```

### Particle Update Pattern
```js
updateParticle(particle, deltaTime) {
  // Apply noise for organic drift
  const noise = this.noiseField.get(particle.position)
  particle.velocity.add(noise)

  // Apply flocking behavior
  const flock = this.calculateFlocking(particle)
  particle.velocity.add(flock)

  // Apply user interaction
  const attraction = this.calculateAttraction(particle, mousePos)
  particle.velocity.add(attraction)

  // Limit speed
  particle.velocity.clampLength(0, MAX_SPEED)

  // Update position
  particle.position.add(particle.velocity.multiplyScalar(deltaTime))

  // Wrap around bounds
  this.wrapBounds(particle.position)
}
```

### Seeded Random Usage
```js
import { SeededRandom } from './utils/random'

const seed = Date.now() // or from URL param
const rng = new SeededRandom(seed)

const particleCount = rng.randomInt(500, 2000)
const hueBase = rng.random() * 360
const speedMultiplier = rng.random() * 0.5 + 0.5
```

### Color Palette Generation
```js
function generatePalette(seed) {
  const rng = new SeededRandom(seed)
  const hueBase = rng.random() * 360
  const hueRange = rng.random() * 60 + 30 // 30-90 degrees

  return {
    primary: `hsl(${hueBase}, 80%, 60%)`,
    secondary: `hsl(${hueBase + hueRange}, 75%, 55%)`,
    accent: `hsl(${hueBase - hueRange}, 70%, 65%)`
  }
}
```

---

## Performance Optimization Tips

### Adaptive Quality
```js
class PerformanceMonitor {
  constructor() {
    this.fpsHistory = []
    this.targetFPS = 60
    this.checkInterval = 60 // frames
  }

  update() {
    this.fpsHistory.push(this.currentFPS)

    if (this.fpsHistory.length >= this.checkInterval) {
      const avgFPS = this.average(this.fpsHistory)

      if (avgFPS < 50) {
        this.reduceQuality()
      }

      this.fpsHistory = []
    }
  }

  reduceQuality() {
    // Reduce particle count by 10-20%
    particleCount = Math.floor(particleCount * 0.85)
    // Or reduce update frequency, clamp pixelRatio, etc.
  }
}
```

### Memory Management
```js
// Always dispose Three.js objects
geometry.dispose()
material.dispose()
texture.dispose()

// Use object pools for frequently created/destroyed objects
class ParticlePool {
  constructor(size) {
    this.pool = []
    for (let i = 0; i < size; i++) {
      this.pool.push(new Particle())
    }
  }

  acquire() { return this.pool.pop() || new Particle() }
  release(particle) { this.pool.push(particle) }
}
```

---

## Debugging

### Common Issues
1. **Low FPS**: Check particle count, reduce density, clamp pixelRatio
2. **Erratic motion**: Check deltaTime usage, clamp velocities
3. **Memory leaks**: Ensure proper disposal of Three.js objects
4. **Mobile issues**: Test with lower particle counts, check touch events

### Debug Helpers
```js
// FPS counter
import Stats from 'three/examples/jsm/libs/stats.module'
const stats = new Stats()
document.body.appendChild(stats.dom)

// Log current seed for reproduction
console.log('Seed:', currentSeed)

// Visualize forces
// (draw debug lines for velocity, attraction, etc.)
```

---

## Session Data

### Recent Sessions
- **2025-10-25**: Memory Bank initialization from PRD

### Common Commands
(To be populated as development progresses)

### Known Quirks
(To be populated as issues are discovered)

---

## References
- Memory Bank: `memory-bank/`
- PRD: `prd.md`
- Three.js Docs: https://threejs.org/docs/
- Vite Docs: https://vitejs.dev/
