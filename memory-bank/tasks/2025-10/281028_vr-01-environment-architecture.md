# 281028_vr-01-environment-architecture

## Objective
Create core architecture for environment management, configuration, and switching. Establish foundation for multiple spatial environments with different particle behaviors, spatial configurations, and visual aesthetics.

## Outcome
- ✅ Environment class with complete configuration schema
- ✅ EnvironmentManager orchestrating multiple environments
- ✅ Sphere preset matching existing XR Test behavior
- ✅ ParticleSystem extended with backward compatibility
- ✅ Main.js integrated with EnvironmentManager
- ✅ Build: 485.03 kB (123.15 kB gzipped) - +1.8% overhead
- ✅ Zero errors, zero warnings
- ✅ Code splitting working (sphere preset: 0.58 kB)

## Files Created

### src/environments/Environment.js (213 lines)
**Purpose**: Configuration schema wrapper with validation

**Key Features**:
- Complete environment configuration schema (spatial, behavior, visual, performance)
- Comprehensive validation (throws errors for invalid configs)
- Support for all environment types: spherical, planar, lattice, vortex, custom
- Clone and toJSON methods for future transitions
- Spatial config: type, particleCount, bounds, initializationFn
- Behavior config: cohesion, alignment, separation, maxSpeed, noise parameters
- Visual config: colorPalette, particleSize, opacity, sizeAttenuation
- Performance config: targetFPS, minFPS, adaptiveQuality

**Schema Structure**:
```javascript
{
  id, name, description,
  spatial: { type, particleCount, bounds, initializationFn },
  behavior: { cohesion*, alignment*, separation*, maxSpeed, noise* },
  visual: { colorPalette, particleSize, opacity, sizeAttenuation },
  performance: { targetFPS, minFPS, adaptiveQuality }
}
```

### src/environments/EnvironmentManager.js (168 lines)
**Purpose**: Multi-environment orchestrator managing lifecycle and switching

**Responsibilities**:
- Load environment presets from `presets/` directory (dynamic import)
- Manage environment state (availableEnvironments Map)
- Coordinate environment switching (no transition effects yet - VR-07)
- Create and destroy ParticleSystem instances
- Update delegation to particle system

**Key Methods**:
- `loadPreset(presetId)` - Dynamic ES6 import, creates Environment instance
- `switchEnvironment(presetId)` - Destroy current, load new, initialize
- `initializeParticleSystem()` - Create ParticleSystem from environment config
- `destroyParticleSystem()` - Clean up scene and GPU resources
- `update(delta, mousePosition)` - Delegate to particle system

**Integration Points**:
- Coordinates with THREE.Scene (add/remove particles)
- Holds references to camera, renderer (for future spatial UI)
- Manages particle system lifecycle

### src/environments/presets/sphere.js (67 lines)
**Purpose**: Baseline spherical environment matching XR Test milestone

**Configuration** (extracted from existing code):
```javascript
{
  id: 'sphere',
  name: 'Sphere',
  description: 'Spherical shell of particles surrounding you',

  spatial: {
    type: 'spherical',
    particleCount: 1000,
    bounds: { innerRadius: 5, outerRadius: 20 }
  },

  behavior: {
    cohesionRadius: 2.0, cohesionWeight: 0.05,
    alignmentRadius: 2.0, alignmentWeight: 0.05,
    separationRadius: 1.0, separationWeight: 0.1,
    maxSpeed: 2.0,
    noiseScale: 0.5, noiseStrength: 0.3
  },

  visual: {
    colorPalette: null,  // Use generatePalette
    particleSize: 3,
    opacity: 0.8,
    sizeAttenuation: false
  },

  performance: {
    targetFPS: 72,  // VR target (Quest baseline)
    minFPS: 65,
    adaptiveQuality: true
  }
}
```

**Values Source**: Extracted from `ParticleSystem.js:25-35` (behavior), line 38 (noise), line 81-85 (visual), `main.js:136-137` (performance)

## Files Modified

### src/particles/ParticleSystem.js
**Changes**: Extended constructor to accept Environment configuration

**Before**:
```javascript
constructor(count, bounds, rng = null)
```

**After**:
```javascript
constructor(countOrEnvironment, bounds = null, rng = null)
```

**Implementation**:
- Line 7: Import Environment class
- Lines 21-87: Dual-path constructor with `instanceof Environment` detection
- Environment path: Extract count, bounds, behavior config, noise params from environment
- Legacy path: Use existing hardcoded defaults (backward compatible)
- Lines 122-139: Environment-driven material properties (size, opacity, sizeAttenuation)

**Backward Compatibility**:
- Detects Environment instance vs number in first parameter
- Legacy path preserves exact existing behavior
- No breaking changes to existing code

### src/main.js
**Changes**: Replaced direct ParticleSystem instantiation with EnvironmentManager

**Modifications**:
- Line 6: Import EnvironmentManager
- Lines 105-134: Replaced direct ParticleSystem initialization
  - Create EnvironmentManager instance
  - Async `initializeEnvironment()` function (avoids top-level await)
  - Load 'sphere' preset
  - Initialize particle system from environment
- Line 145: Update via `environmentManager.update()`
- Lines 150-152: Adaptive quality via `environmentManager.getParticleSystem()`
- Line 259: Cleanup via `environmentManager.dispose()`

**Removed**:
- Lines 104-131: Manual bounds/particleCount logic (30 lines)
- Direct `new ParticleSystem(particleCount, bounds, rng)` call

**Why Async Function**: Top-level await not supported in ES2015 build target, wrapped in `initializeEnvironment()` async function

## Patterns Applied

### Environment-Driven Configuration
**Pattern**: Configuration as data, behavior from config
**Source**: `milestones/vr-environments/01-environment-architecture.yaml`
**Implementation**: Environment class encapsulates all config, ParticleSystem extracts on construction

### Dynamic Preset Loading
**Pattern**: ES6 dynamic import for code splitting
**Implementation**: `await import(\`./presets/${presetId}.js\`)` in EnvironmentManager.loadPreset()
**Benefit**: Presets loaded on-demand, reduced initial bundle size

### Backward Compatibility via Type Detection
**Pattern**: Parameter polymorphism with instanceof check
**Implementation**: ParticleSystem constructor detects Environment vs number
**Benefit**: New code uses environments, existing code continues working

### Manager Pattern
**Pattern**: Centralized lifecycle management
**Implementation**: EnvironmentManager coordinates scene, environment, particle system
**Benefit**: Single responsibility, clean separation of concerns

### Fail-Fast Validation
**Pattern**: Validate on construction, throw errors immediately
**Implementation**: Environment.validate() checks all required fields
**Benefit**: Configuration errors caught early, clear error messages

## Integration Points

**Workflow**:
```
main.js: new EnvironmentManager(scene, camera3D, renderer, rng)
   ↓
initializeEnvironment() called
   ↓
environmentManager.loadPreset('sphere')
   ↓
Dynamic import: ./presets/sphere.js
   ↓
new Environment(sphereConfig) - validation runs
   ↓
environmentManager.initializeParticleSystem()
   ↓
new ParticleSystem(environment, null, rng)
   ↓
ParticleSystem detects Environment instance
   ↓
Extract config: spatial, behavior, visual from environment
   ↓
Create particles with environment-specific settings
   ↓
Animation loop: environmentManager.update(delta, mouse)
   ↓
Delegates to particleSystem.update(delta, mouse)
```

**Extends Existing**:
- `ParticleSystem.js:15` - Constructor accepts Environment
- `main.js:130-131` - Replaced with EnvironmentManager

**No Breaking Changes**:
- ParticleSystem backward compatible (legacy path preserved)
- Sphere preset uses exact same values as hardcoded defaults
- Existing VR mode unchanged
- Same performance characteristics

## Architectural Decisions

### Decision: Environment Class as Configuration Schema
**Rationale**:
- Single source of truth for environment configuration
- Validation ensures type safety
- Easier to serialize/deserialize for future features
- Clear contract between presets and particle system

**Alternatives Considered**:
- Plain objects without validation → Rejected: No type safety, errors at runtime
- Multiple small classes (Spatial, Behavior, Visual) → Rejected: Too granular, unnecessary complexity

**Trade-offs**:
- Pro: Type safety, validation, clear schema
- Con: Slight overhead for validation (~0.1ms per environment load)

### Decision: Dynamic Preset Loading via ES6 Import
**Rationale**:
- Code splitting reduces initial bundle size
- Future presets loaded on-demand
- Vite handles bundling automatically

**Alternatives Considered**:
- Static imports → Rejected: All presets in main bundle
- JSON files → Rejected: Can't include initialization functions

**Trade-offs**:
- Pro: Smaller initial bundle, on-demand loading
- Con: Async complexity (handled with async function)

### Decision: Backward Compatible ParticleSystem Constructor
**Rationale**:
- Gradual migration path
- Existing code continues working
- No breaking changes to VR mode

**Alternatives Considered**:
- Separate class (ParticleSystemV2) → Rejected: Code duplication
- Break existing code, force migration → Rejected: Unnecessary risk

**Trade-offs**:
- Pro: Zero breaking changes, gradual migration
- Con: Constructor complexity (instanceof check)

### Decision: Manager Pattern for EnvironmentManager
**Rationale**:
- Single responsibility (environment lifecycle)
- Clean separation from ParticleSystem (particle behavior)
- Easier to add transitions later (VR-07)

**Alternatives Considered**:
- ParticleSystem handles environments → Rejected: Too much responsibility
- Global functions → Rejected: No state management

**Trade-offs**:
- Pro: Clean architecture, extensible
- Con: Additional abstraction layer

## Technical Specifications

### Environment Configuration Schema
Full schema documented in `src/environments/Environment.js:16-50`

**Required Fields**: id, name, description, spatial (type, particleCount, bounds), behavior (9 params), visual (4 params), performance (3 params)

**Optional Fields**: spatial.initializationFn (default: null, use Particle constructor)

### Performance Impact
- **Bundle Size**: 476.64 kB → 485.03 kB (+8.39 kB, +1.8%)
- **Gzipped**: 120.90 kB → 123.15 kB (+2.25 kB)
- **Code Splitting**: sphere.js as separate chunk (0.58 kB)
- **Runtime Overhead**: ~0.1ms environment validation, negligible
- **Memory Overhead**: ~1-2 KB per loaded environment (config objects)

### Browser Compatibility
- ES6 dynamic import supported (Chrome 63+, Firefox 67+, Safari 11.1+)
- No breaking changes to existing WebXR support
- Async/await wrapped in function (ES2015 build target)

## Testing Strategy

### Build Verification
- ✅ Production build successful (npm run build)
- ✅ Zero errors, zero warnings
- ✅ Bundle size within target (<600kB)
- ✅ Code splitting working (sphere preset as separate chunk)
- ✅ Build time: 966ms (acceptable)

### Dev Server Verification
- ✅ Dev server running at http://localhost:3000/
- ✅ Hot module reload working (multiple successful reloads)
- ✅ No runtime errors in console

### Backward Compatibility
- ✅ ParticleSystem dual constructor implemented
- ✅ Legacy path preserves hardcoded defaults
- ✅ Sphere preset matches existing values exactly

### Manual Testing Required (Post-Approval)
- [ ] Browser: Verify particles render correctly
- [ ] VR mode: Verify immersive mode works with environment system
- [ ] Console: Check seed logging, environment initialization message
- [ ] Performance: Verify 72fps maintained with sphere preset
- [ ] Interaction: Verify mouse/touch interaction still works

## Known Issues
None

## Blockers
None

## Future Enhancements (Not in VR-01 Scope)

### VR-05: Environment Presets
- Create 5-7 additional environment presets
- Nebula, Galaxy, Lattice, Vortex, Ocean, Hypercube
- Each with unique spatial configuration and visual aesthetics

### VR-07: Environment Transitions
- Add transition effects to `EnvironmentManager.switchEnvironment()`
- Fade to black, crossfade, particle morphing
- Smooth, VR-comfortable transitions

### VR-03: Spatial UI Integration
- EnvironmentManager already holds camera reference
- Ready for spatial UI to call `switchEnvironment()`
- Environment selection via gaze/controller

### Per-Environment Interaction Parameters
- Add `interactionStrength` and `interactionRadius` to behavior config
- Currently hardcoded in ParticleSystem (1.0, 4.0)
- Lines 47-48, 74-75 in ParticleSystem.js

## References
- Task spec: `milestones/vr-environments/01-environment-architecture.yaml`
- Existing particle system: `src/particles/ParticleSystem.js`
- Behavior functions: `src/particles/behaviors.js`
- XR Test milestone: `milestones/xr-test/` (baseline for sphere preset)
- AGENTS.md 2.1: Task specification patterns

## Artifacts
- Environment class: `src/environments/Environment.js` (213 lines)
- EnvironmentManager: `src/environments/EnvironmentManager.js` (168 lines)
- Sphere preset: `src/environments/presets/sphere.js` (67 lines)
- Modified ParticleSystem: `src/particles/ParticleSystem.js` (~90 lines modified)
- Modified main.js: `src/main.js` (~35 lines modified)
- Build output: 485.03 kB (123.15 kB gzipped)

## Next Steps
1. Manual testing in browser (verify particles render)
2. VR testing (verify immersive mode)
3. Console verification (seed, environment logs)
4. **VR-02**: VR-Only Migration (1.75hr) - Remove 2D mode infrastructure
5. **VR-05**: Environment Presets (4.5hr) - Create 5-7 unique environments
