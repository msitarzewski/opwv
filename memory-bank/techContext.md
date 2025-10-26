# Technical Context

## Tech Stack

### Core Technologies
- **Three.js**: WebGL renderer and scene management
- **JavaScript**: ES6+ (modules, classes, async/await)
- **Vite**: Build tool for fast development and optimized production bundles
- **Simplex/Perlin Noise**: Optional noise sources for organic motion

### Development Environment
- **Node.js**: Latest LTS
- **Package Manager**: npm or yarn
- **Browser DevTools**: Chrome/Firefox for debugging and performance profiling

## Performance Targets

### Desktop
- **Target**: 60fps sustained
- **Particle Count**: Hundreds to thousands
- **Resolution**: Adaptive to window size

### Mobile
- **Target**: 60fps with graceful degradation
- **Strategy**: Auto-scale particle count based on device capability
- **Resolution**: Adaptive to screen density

### Memory Management
- Memory-safe render loop (no leaks)
- Proper cleanup of Three.js objects
- Efficient particle buffer management

## Browser Support

### Desktop (Latest Versions)
- Chrome
- Safari
- Firefox
- Edge

### Mobile
- Safari (iOS)
- Chrome (Android)
- **Fallback**: Lower particle density for older devices

## Technical Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Mobile performance dips | Auto-scale particle count based on FPS monitoring |
| Randomness generates "ugly" frames | Set safe min/max constants for all parameters |
| High-DPI screens stress GPU | Adaptive resolution scaling (pixelRatio clamping) |
| Memory leaks | Proper disposal in cleanup, monitoring tools |

## Recommended Repo Structure
```
/src
  /shaders       # Custom GLSL shaders (if needed)
  /particles     # Particle system logic
  /utils         # Noise, math helpers
  main.js        # Entry point
index.html       # Minimal HTML shell
vite.config.js   # Build configuration
README.md        # Project documentation
```

## Animation Architecture (Pseudocode)
```js
// Inside render loop:
for each particle:
  applyNoise()           // Simplex/Perlin for organic drift
  applyFlocking()        // Cohesion, alignment, separation
  applyUserAttraction()  // Mouse/touch influence
  updatePosition()       // Integrate velocity, wrap/bounds
renderer.render(scene, camera)
```

## Dependencies (Expected)
- `three`: ^0.160.0 (or latest)
- `vite`: ^5.0.0
- `simplex-noise`: ^4.0.0 (or equivalent)
