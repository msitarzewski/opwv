# 281028_xr-04-spherical-particle-space

## Objective
Adapt the particle system from 2D planar space to 3D spherical space surrounding the camera, enabling particles to be visible in all directions for 360° WebXR viewing.

## Outcome
- ✅ Build: Successful (803ms)
- ✅ Errors: 0
- ✅ Warnings: 0
- ✅ Bundle: 477.07 kB (+5.28 kB, +1.1%)
- ✅ Gzipped: 121.01 kB (+1.79 kB, +1.5%)

## Files Modified

### Core 3D Functionality
- `src/utils/noise.js` - Added `get3D(x, y, z, time)` method for 3D noise vectors
- `src/particles/behaviors.js` - Added `wrapSphericalBounds(position, innerRadius, outerRadius)` for spherical boundary wrapping
- `src/particles/Particle.js` - Implemented spherical initialization using (r, θ, φ) coordinates
- `src/particles/ParticleSystem.js` - Added mode detection and 3D behavior support
- `src/main.js` - Conditional bounds: Spherical for VR (1000 particles, radius 5-20), planar for 2D (500 particles)

### Configuration
- `vite.config.js` - Added documentation comment about HTTPS requirement for Safari WebXR

## Implementation Details

### Spherical Particle Initialization
**File**: `src/particles/Particle.js:16-62`

Particles now detect spherical bounds via `innerRadius` and `outerRadius` properties:
- **Spherical coordinates**: Random (r, θ, φ) between inner and outer radius
- **Cartesian conversion**:
  - x = r × sin(φ) × cos(θ)
  - y = r × sin(φ) × sin(θ)
  - z = r × cos(φ)
- **3D velocity**: Random (x, y, z) components for spatial motion
- **Backward compatible**: Detects 2D bounds and maintains planar behavior

### 3D Noise Field
**File**: `src/utils/noise.js:49-86`

Added `get3D()` method alongside existing `get()`:
- Samples 3 independent noise values for x, y, z axes
- Uses spatial offsets (1000, 2000) to decorrelate noise dimensions
- Returns `{x, y, z}` noise vector for 3D force application
- Original 2D `get()` method preserved for backward compatibility

### Spherical Boundary Wrapping
**File**: `src/particles/behaviors.js:161-176`

New `wrapSphericalBounds()` function:
- Calculates distance from origin using `position.length()`
- When particle exceeds outer radius, wraps to opposite side at inner radius
- Formula: `position.normalize().multiplyScalar(-innerRadius)`
- Creates seamless infinite space feel (similar to toroidal 2D wrapping)

### Mode-Aware Behaviors
**File**: `src/particles/ParticleSystem.js:130-165`

ParticleSystem detects mode via bounds properties:
- **Spherical mode**: Uses `get3D()` for noise, `wrapSphericalBounds()` for boundaries
- **Planar mode**: Uses `get()` for noise, `wrapBounds()` for boundaries
- **Flocking behaviors**: Unchanged, already 3D-compatible (use Vector3 operations)

### Conditional Initialization
**File**: `src/main.js:95-121`

VR mode (PerspectiveCamera):
- Bounds: `{innerRadius: 5, outerRadius: 20}`
- Particle count: 1000 (for 360° coverage)
- Camera at origin (0, 0, 0)

2D mode (OrthographicCamera):
- Bounds: `{minX, maxX, minY, maxY}` from frustum
- Particle count: 500 (original)
- Camera at (0, 0, 5)

## Patterns Applied
- `systemPatterns.md#Particle System` - Extended for 3D spherical space
- Mode detection pattern: Feature detection via object properties (no explicit flags)
- Backward compatibility: Additive changes, zero breaking API modifications

## Integration Points
- `src/main.js:100-118` - Initializes spherical bounds when `vrModeRequested === true`
- `src/particles/ParticleSystem.js:131` - Detects spherical mode via bounds properties
- `src/particles/ParticleSystem.js:135-143` - Applies 3D or 2D noise based on mode
- `src/particles/ParticleSystem.js:161-165` - Calls appropriate boundary wrapping function
- XR-02 integration: PerspectiveCamera positioned at origin (perfect for 360° view)

## Technical Decisions

### Why spherical coordinates for initialization?
Uniform distribution in 3D sphere requires spherical (r, θ, φ) coordinates. Direct Cartesian random (x, y, z) produces cubic distribution, not spherical. Task spec explicitly recommended this approach.

### Why opposite-side wrapping?
Creates seamless infinite space feel similar to toroidal 2D wrapping. Large outer radius (20 units) minimizes visible teleportation. Alternative (hard boundary) would cause particles to cluster at edges.

### Why 1000 particles for VR?
- 500 particles adequate for 180° 2D view (frustum)
- 360° spherical view has ~2× surface area
- 1000 provides adequate density without overwhelming performance
- Adaptive quality (MVP-09) will reduce if needed

### Why mode detection via bounds properties?
- Clean, self-documenting API
- No additional mode flag parameter needed
- Natural extension of existing architecture
- Zero breaking changes to existing code

### Why radius 5-20 units?
- Inner radius (5): Prevents particles too close to camera (obscuring view)
- Outer radius (20): Large enough for depth perception, small enough to maintain particle visibility
- Ratio (4:1): Provides good distribution density
- Tuneable: Comments indicate range for adjustment (3-10 inner, 15-30 outer)

## Acceptance Criteria Verification

Per `milestones/xr-test/04-spherical-particle-space.yaml`:

| Criterion | Status | Verification |
|-----------|--------|--------------|
| Particles initialized in 3D spherical volume | ✅ PASS | `Particle.js:23-40` uses spherical coordinates |
| Particle bounds changed to 3D sphere | ✅ PASS | `main.js:103-106` defines spherical bounds in VR mode |
| Boundary wrapping adapted for spherical space | ✅ PASS | `behaviors.js:168-176` implements spherical wrapping |
| Particle density appropriate in VR | ⚠️ MANUAL | Requires VR headset testing (1000 particles baseline) |
| Flocking behaviors work in 3D space | ✅ PASS | All flocking uses Vector3 operations (3D-compatible) |
| All particles visible from center | ⚠️ MANUAL | Requires VR headset testing with 360° view |

## Manual Testing Required

Cannot be automated without VR hardware:

1. **Particle Density**: Verify 1000 particles provide appropriate coverage
   - Not too sparse (visible gaps)
   - Not too dense (performance impact)
   - Tune `particleCount` in `main.js:107` if needed (750-1500 range)

2. **360° Visibility**: Confirm particles visible in all directions
   - Look up/down/left/right/behind in VR
   - Verify spherical distribution (not clustered)
   - Verify no "dead zones" without particles

3. **Boundary Behavior**: Test wrapping at outer radius
   - Observe particles that exceed 20 units from origin
   - Should teleport smoothly to opposite side at 5 units
   - Should feel seamless (large radius minimizes visible teleportation)

## Bundle Impact
- Total: +5.28 kB (+1.1%)
- Gzipped: +1.79 kB (+1.5%)
- Impact: Minimal and acceptable for 3D + VR functionality

## Backward Compatibility
- ✅ 2D mode preserved: Uses planar bounds when `vrModeRequested === false`
- ✅ Existing particle count (500) maintained for 2D
- ✅ Existing noise method `get()` still functional
- ✅ Existing boundary wrapping `wrapBounds()` still used in 2D
- ✅ No breaking API changes

## Dependencies
- XR-02: Camera System Conversion (PerspectiveCamera at origin for 360° view)
- MVP-04: Particle System Foundation (BufferGeometry, Points rendering)
- MVP-05: Organic Motion Behaviors (Flocking already 3D-compatible)

## Testing Performed
**Automated**:
- ✅ Build successful (npm run build)
- ✅ Syntax validation (all files valid JavaScript)
- ✅ Code integration (imports correct, functions called properly)
- ✅ Zero errors, zero warnings

**Manual** (Required):
- ⚠️ VR headset testing needed
- ⚠️ 360° visibility verification needed
- ⚠️ Particle density tuning may be required

## Next Steps
1. Test in VR mode with headset
2. Tune particle count if needed (750-1500 range)
3. Tune radius if needed (inner: 3-10, outer: 15-30)
4. Proceed to XR-05 if density acceptable

## Artifacts
- Task YAML: `milestones/xr-test/04-spherical-particle-space.yaml`
- Commit: Pending (awaiting manual testing verification)
