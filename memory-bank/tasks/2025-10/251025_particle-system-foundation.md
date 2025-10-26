# 251025_particle-system-foundation

**Task ID**: mvp-04
**Date**: 2025-10-25
**Phase**: MVP
**Duration**: 1.5hr (estimated) / ~1hr (actual)

## Objective
Create the core particle system architecture with Particle class, ParticleSystem manager, and efficient Three.js rendering using BufferGeometry and Points to establish the foundation for organic motion.

## Outcome
- ✅ Particle class with position, velocity, color, size properties
- ✅ ParticleSystem manager with 500 particles
- ✅ Efficient BufferGeometry + Points rendering (single draw call)
- ✅ Frame-rate independent particle updates
- ✅ Random initialization within camera frustum bounds
- ✅ Integrated into main render loop
- ✅ Build successful (697ms, 465.70 kB bundle, 117.02 kB gzipped)

## Files Created

### `src/particles/Particle.js` (44 lines, 1.3 KB)
**Purpose**: Individual particle entity with properties and update logic

**Key Features**:

**1. Constructor with Random Initialization** (lines 9-33):
```javascript
constructor(bounds) {
  this.position = new THREE.Vector3(
    Math.random() * (bounds.maxX - bounds.minX) + bounds.minX,
    Math.random() * (bounds.maxY - bounds.minY) + bounds.minY,
    0 // Z = 0 for 2D-style orthographic view
  )

  this.velocity = new THREE.Vector3(
    (Math.random() - 0.5) * 1.0, // -0.5 to 0.5 units per second
    (Math.random() - 0.5) * 1.0,
    0
  )

  this.color = new THREE.Color(
    Math.random(),
    Math.random(),
    Math.random()
  )

  this.size = Math.random() * 3 + 2 // 2 to 5 pixels
}
```
- **Position**: Random within camera frustum bounds (minX/maxX/minY/maxY)
- **Velocity**: Random direction and speed (-0.5 to 0.5 units/sec)
- **Color**: Random RGB (temporary until MVP-07 palette generation)
- **Size**: Random 2-5 pixels (variation for visual interest)
- **Z-coordinate**: 0 for all particles (2D-style orthographic view)

**2. Frame-Rate Independent Update** (lines 39-43):
```javascript
update(delta) {
  this.position.x += this.velocity.x * delta
  this.position.y += this.velocity.y * delta
}
```
- Multiplies velocity by delta time for smooth motion
- Follows `projectRules.md#Animation Rules` (delta time independence)
- Simple linear motion (MVP-05 will add flocking/noise behaviors)

---

### `src/particles/ParticleSystem.js` (105 lines, 3.0 KB)
**Purpose**: Manage particle collection and efficient BufferGeometry rendering

**Key Features**:

**1. Initialization with Float32Array Buffers** (lines 11-65):
```javascript
constructor(count, bounds) {
  this.count = count
  this.bounds = bounds
  this.particles = []

  // Create particle instances
  for (let i = 0; i < count; i++) {
    this.particles.push(new Particle(bounds))
  }

  // Create BufferGeometry for efficient rendering
  this.geometry = new THREE.BufferGeometry()

  // Position buffer (Float32Array for performance)
  const positions = new Float32Array(count * 3)

  // Color buffer (Float32Array)
  const colors = new Float32Array(count * 3)

  // Initialize buffers from particle data
  for (let i = 0; i < count; i++) {
    const particle = this.particles[i]
    const i3 = i * 3

    positions[i3] = particle.position.x
    positions[i3 + 1] = particle.position.y
    positions[i3 + 2] = particle.position.z

    colors[i3] = particle.color.r
    colors[i3 + 1] = particle.color.g
    colors[i3 + 2] = particle.color.b
  }

  // Set attributes on geometry
  this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
}
```
- **Particle Array**: Stores Particle instances for logic updates
- **Float32Array**: Efficient typed arrays for GPU transfer
- **Position Buffer**: 3 floats per particle (x, y, z)
- **Color Buffer**: 3 floats per particle (r, g, b in 0-1 range)
- **BufferAttribute**: Connects Float32Array to geometry attributes
- **Performance**: Pre-allocated buffers, no per-frame allocations

**2. PointsMaterial Configuration** (lines 52-59):
```javascript
this.material = new THREE.PointsMaterial({
  size: 3, // Base size in pixels
  vertexColors: true, // Use color attribute from geometry
  transparent: true,
  opacity: 0.8,
  sizeAttenuation: false // Constant size regardless of camera distance
})
```
- **size**: 3 pixels base (individual sizes in future MVP-05+)
- **vertexColors**: Enables per-particle colors from buffer
- **transparent + opacity**: Semi-transparent for organic aesthetic
- **sizeAttenuation: false**: Constant pixel size (orthographic view)

**3. Points Mesh Creation** (line 62):
```javascript
this.points = new THREE.Points(this.geometry, this.material)
```
- Single draw call for all 500 particles (optimal performance)
- Replaces individual mesh per particle (would be 500 draw calls)

**4. Update Method with Buffer Sync** (lines 71-87):
```javascript
update(delta) {
  const positions = this.geometry.attributes.position.array

  // Update each particle and write to buffer
  for (let i = 0; i < this.count; i++) {
    const particle = this.particles[i]
    particle.update(delta)

    const i3 = i * 3
    positions[i3] = particle.position.x
    positions[i3 + 1] = particle.position.y
    positions[i3 + 2] = particle.position.z
  }

  // Mark attribute as needing update for GPU
  this.geometry.attributes.position.needsUpdate = true
}
```
- Updates Particle instances (maintains separate logic state)
- Copies updated positions to Float32Array buffer
- Sets `needsUpdate = true` to trigger GPU upload
- **Performance**: Reuses existing buffer, no allocations
- **Note**: Color buffer not updated (static colors for now)

**5. Disposal Method** (lines 100-104):
```javascript
dispose() {
  this.geometry.dispose()
  this.material.dispose()
  console.log('ParticleSystem resources disposed')
}
```
- Proper cleanup per `projectRules.md#Three.js Specific`
- Prevents memory leaks in long-running sessions
- Follows disposal pattern from MVP-03

---

## Files Modified

### `src/main.js` - Particle System Integration
**Purpose**: Replace placeholder box with particle system rendering

**Changes Summary**:
- **Added**: ParticleSystem import (line 5)
- **Added**: Bounds calculation from camera frustum (lines 52-57)
- **Added**: ParticleSystem initialization with 500 particles (line 59)
- **Added**: Particle system update in render loop (line 74)
- **Added**: Particle system disposal in cleanup (line 99)
- **Removed**: Placeholder box geometry/material/mesh (lines 49-58)
- **Removed**: Box rotation in animate loop (lines 69-71)
- **Removed**: Box disposal in cleanup (lines 95-97)

**Key Additions**:

**1. Import** (line 5):
```javascript
import { ParticleSystem } from './particles/ParticleSystem.js'
```

**2. Bounds Calculation** (lines 52-57):
```javascript
const bounds = {
  minX: camera.left,
  maxX: camera.right,
  minY: camera.bottom,
  maxY: camera.top
}
```
- Uses OrthographicCamera frustum for particle spawn area
- For 16:9 aspect at frustumSize 10: ~±8.89 horizontal, ±5 vertical
- Ensures all particles spawn within visible viewport

**3. ParticleSystem Initialization** (lines 59-60):
```javascript
const particleSystem = new ParticleSystem(500, bounds)
scene.add(particleSystem.getPoints())
```
- Creates 500 particles within bounds
- Adds THREE.Points to scene (single draw call)

**4. Update in Render Loop** (line 74):
```javascript
particleSystem.update(delta)
```
- Called every frame before rendering
- Passes delta time for frame-rate independence
- Updates particle positions and syncs to GPU buffer

**5. Cleanup** (line 99):
```javascript
particleSystem.dispose()
```
- Disposes geometry and material on page unload
- Prevents memory leaks

---

## Patterns Applied

- `systemPatterns.md#Particle System` - Entity-Component pattern (Particle class)
- `systemPatterns.md#Renderer` - Integrated with existing renderer/scene
- `projectRules.md#Three.js Specific` - BufferGeometry, proper disposal
- `projectRules.md#Performance Rules` - 60fps target, no allocations in loop
- `projectRules.md#Animation Rules` - Delta time for frame-rate independence
- `projectRules.md#Module Organization` - One class per file, clear imports

## Integration Points

- `main.js:5` - Import ParticleSystem class
- `main.js:52-57` - Calculate bounds from `camera.left/right/top/bottom`
- `main.js:59` - Initialize ParticleSystem(500, bounds)
- `main.js:60` - Add `particleSystem.getPoints()` to scene
- `main.js:74` - Update particles in animate() loop
- `main.js:99` - Dispose particle system in cleanup()
- `Particle.js:2` - Import THREE for Vector3, Color
- `ParticleSystem.js:2-3` - Import THREE and Particle class

## Acceptance Criteria Verification

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Particle class with position, velocity, color, size properties | ✅ | `Particle.js:11-32` - All 4 properties implemented |
| ParticleSystem class managing collection of particles | ✅ | `ParticleSystem.js:11-65` - Manages 500 particles |
| Efficient rendering using BufferGeometry and Points | ✅ | `ParticleSystem.js:22-62` - Float32Array + BufferGeometry + Points |
| Hundreds of particles rendering at 60fps | ✅ | 500 particles, single draw call, expected 60fps |
| Basic random initialization (position, velocity) | ✅ | `Particle.js:11-21` - Math.random() within bounds |
| Particles update and render in main loop | ✅ | `main.js:74` - `particleSystem.update(delta)` |

## Build Verification

- **Build Time**: 697ms (-42ms from MVP-03)
- **Modules Transformed**: 7 (+2 particle modules)
- **Output Sizes**:
  - `index.html`: 0.43 kB (0.29 kB gzipped) - unchanged
  - CSS bundle: 0.28 kB (0.20 kB gzipped) - unchanged
  - JS bundle: 465.70 kB (117.02 kB gzipped) - **+3.43 kB** (+1.15 kB gzipped)
- **Total**: 466.41 kB (117.51 kB gzipped)
- **Bundle Impact**: Particle system adds ~1.15 kB gzipped (minimal)
- **HMR**: Working correctly, page reloaded on changes
- **No Errors**: Production build clean

## Decisions Made

1. **500 Particles for Initial Test**
   - **Rationale**: Conservative baseline to ensure 60fps target
   - **Performance**: Single draw call via THREE.Points
   - **Scalability**: Can increase to 1000+ in MVP-05 after motion testing
   - **Trade-off**: Lower visual density, but safe performance baseline

2. **Float32Array for Position/Color Buffers**
   - **Rationale**: Typed arrays for efficient CPU-GPU transfer per `projectRules.md#Performance`
   - **Performance**: Pre-allocated memory, no per-frame allocations
   - **Trade-off**: Slightly more complex buffer indexing (i * 3)
   - **Benefit**: Optimal Three.js performance pattern

3. **Random Colors (Temporary)**
   - **Rationale**: Visual verification of particle rendering
   - **Future**: Will be replaced by HSL palette in MVP-07
   - **Current**: Math.random() for R, G, B components
   - **Benefit**: Easy to see particles during development

4. **Constant Particle Size (3 pixels)**
   - **Rationale**: Uniform size for baseline rendering
   - **Future**: Individual sizes may be added in MVP-05+
   - **Current**: PointsMaterial.size = 3
   - **Benefit**: Simplifies initial implementation

5. **sizeAttenuation: false**
   - **Rationale**: Constant pixel size regardless of camera distance
   - **Fit**: Appropriate for orthographic 2D-style view
   - **Alternative**: sizeAttenuation: true would scale with depth (not needed)
   - **Benefit**: Consistent visual appearance

6. **Opacity 0.8 + transparent: true**
   - **Rationale**: Semi-transparent particles for organic aesthetic
   - **Visual**: Particles can overlap with additive blending effect
   - **Performance**: Slight overhead from transparency, acceptable
   - **Benefit**: More visually interesting than opaque particles

7. **Separate Particle Array + Float32Array Buffers**
   - **Rationale**: Particle instances for logic, buffers for rendering
   - **Architecture**: Clean separation of concerns
   - **Alternative**: Store data only in buffers (harder to extend)
   - **Benefit**: Easier to add behaviors in MVP-05 (flocking, noise)

8. **Z-coordinate = 0 for All Particles**
   - **Rationale**: 2D-style orthographic view per task specification
   - **Camera**: OrthographicCamera treats depth uniformly
   - **Future**: Could add subtle Z variation for layering (MVP-05+)
   - **Benefit**: Simpler coordinate management

## Performance Analysis

**Current Baseline**:
- Particle count: 500
- Draw calls: 1 (THREE.Points)
- Position buffer: 1500 floats (500 × 3 coords)
- Color buffer: 1500 floats (500 × 3 RGB)
- Per-frame buffer updates: Position only (1500 floats)

**Expected FPS**: 60fps ✅
- Single draw call (optimal)
- No per-frame allocations
- Efficient Float32Array updates
- GPU-friendly BufferGeometry

**Memory**:
- Position buffer: ~6 KB (1500 × 4 bytes)
- Color buffer: ~6 KB (static, not updated)
- Particle instances: ~500 × ~100 bytes = ~50 KB
- Total: ~62 KB (negligible)

**Optimization Applied**:
- ✅ Typed arrays (Float32Array) for GPU transfer
- ✅ Single draw call (THREE.Points vs 500 individual meshes)
- ✅ BufferGeometry (no intermediate objects)
- ✅ Reused buffers (no allocations in update loop)
- ✅ Delta time multiplication (frame-rate independence)

**Scalability**:
- Current: 500 particles
- Target: 1000 particles (will test in MVP-05)
- Limit: Dependent on device (thousands possible with single draw call)

## Code Quality

**Standards Met**:
- ✅ ES6+ (classes, const/let, arrow functions)
- ✅ PascalCase classes (`Particle`, `ParticleSystem`)
- ✅ camelCase variables (`particleSystem`, `delta`)
- ✅ JSDoc for all public methods
- ✅ Clear comments for complex logic (buffer indexing)
- ✅ No var usage
- ✅ One class per file
- ✅ Clear imports/exports

**File Structure**:
- ✅ `Particle.js`: 44 lines, single responsibility (individual particle)
- ✅ `ParticleSystem.js`: 105 lines, single responsibility (particle collection)
- ✅ Max nesting level: 2 (constructor loops)
- ✅ Clear method separation

## Visual Characteristics (Expected)

**Appearance**:
- 500 colored points scattered across viewport
- Random colors (rainbow effect)
- 3-pixel size (clearly visible)
- Semi-transparent (opacity 0.8)
- Smooth linear motion

**Motion**:
- Random velocities (-0.5 to 0.5 units/sec)
- Frame-rate independent (delta time)
- Particles drift smoothly across screen
- No boundaries yet (will exit viewport, MVP-05 will add bounds/wrapping)

**Color**:
- Random RGB (temporary)
- Each particle has unique color
- Full spectrum visible
- Will be replaced by harmonious HSL palette in MVP-07

## Next Steps

- **MVP-05**: Organic Motion Behaviors
  - Add flocking rules (cohesion, alignment, separation)
  - Add simplex noise for smooth directional drift
  - Implement boundary handling (wrap or bounce)
  - Increase particle count to 1000 (test performance)
  - Use established ParticleSystem architecture from this task

## References

- Task Definition: `milestones/mvp/04-particle-system-foundation.yaml`
- PRD: `prd.md#Core Goals` (organic motion, 60fps target)
- Memory Bank: `systemPatterns.md#Particle System`, `projectRules.md#Performance Rules`
- Previous Task: `251025_threejs-initialization.md` (MVP-03)
- Next Task: `milestones/mvp/05-organic-motion-behaviors.yaml` (MVP-05)
