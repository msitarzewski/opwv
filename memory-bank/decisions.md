# Architectural Decision Records (ADRs)

## 2025-10-25: Use Three.js for WebGL Rendering

**Status**: Approved

**Context**: Need a WebGL library for particle rendering with good performance and developer experience.

**Decision**: Use Three.js as the WebGL abstraction layer.

**Alternatives Considered**:
- **Raw WebGL**: Maximum control but high complexity, slow development
- **PixiJS**: Great for 2D but less suited for 3D particle systems
- **Babylon.js**: Feature-rich but heavier, overkill for this project

**Rationale**:
- Three.js is well-documented and widely adopted
- Excellent performance for particle systems (Points, InstancedMesh)
- Good mobile support
- Active community and ecosystem
- Right balance of abstraction vs. control

**Consequences**:
- **Positive**: Faster development, robust renderer, good examples
- **Negative**: Slight overhead vs. raw WebGL (negligible for this use case)

**References**: `prd.md#Technical Requirements`

---

## 2025-10-25: Use Vite for Build Tooling

**Status**: Approved

**Context**: Need fast development experience and optimized production builds.

**Decision**: Use Vite as build tool and dev server.

**Alternatives Considered**:
- **Webpack**: Powerful but slower, more complex config
- **Parcel**: Simple but less flexible
- **No bundler**: Would require manual script management, no optimizations

**Rationale**:
- Extremely fast hot module replacement (HMR)
- Simple configuration
- Excellent ES module support
- Optimized production builds with rollup
- Great developer experience

**Consequences**:
- **Positive**: Fast iteration, simple setup, modern tooling
- **Negative**: Newer tool (but mature enough for production)

**References**: `prd.md#Technical Requirements`

---

## 2025-10-25: Client-Only Architecture (No Backend)

**Status**: Approved

**Context**: MVP scope requires instant loading and no infrastructure overhead.

**Decision**: Pure client-side application with no server components.

**Alternatives Considered**:
- **Server-side rendering**: Unnecessary complexity for this use case
- **Backend for seed storage**: Adds complexity, not needed for MVP

**Rationale**:
- Simplest deployment (static hosting)
- Instant loading
- No infrastructure costs
- Aligns with MVP goals
- Can add backend later if needed (seed sharing, etc.)

**Consequences**:
- **Positive**: Simple deployment, no backend maintenance, fast loading
- **Negative**: Seed sharing requires URL params (acceptable for MVP)

**References**: `prd.md#Non-Goals`

---

## 2025-10-25: Seeded Randomization for Reproducibility

**Status**: Approved

**Context**: Want unique visuals every time but with potential to recreate specific instances.

**Decision**: Use seeded random number generation for all randomness.

**Rationale**:
- Enables future seed sharing via URL params
- Debugging is easier with reproducible states
- Users can return to visuals they loved
- Minimal implementation cost

**Consequences**:
- **Positive**: Reproducible visuals, shareable, easier debugging
- **Negative**: Slightly more complex than Math.random() (minimal)

**References**: `prd.md#Animation Behavior`

---

## 2025-10-25: Adaptive Performance Strategy

**Status**: Approved

**Context**: Need to maintain 60fps across wide range of devices.

**Decision**: Implement FPS monitoring and adaptive particle count scaling.

**Approach**:
- Monitor FPS every 60 frames
- If FPS < 50: reduce particle count by 10-20%
- Clamp devicePixelRatio for high-DPI screens
- Start with conservative defaults, scale up if headroom

**Alternatives Considered**:
- **Fixed quality levels**: Less smooth, requires user choice (not MVP)
- **Device detection**: Brittle, can't account for background load
- **No adaptation**: Would fail on lower-end devices

**Rationale**:
- Automatic, no user intervention
- Graceful degradation
- Better experience across devices
- Aligns with MVP "zero-config" goal

**Consequences**:
- **Positive**: Smooth experience on all devices, automatic adaptation
- **Negative**: Particle count may vary during runtime (acceptable)

**References**: `prd.md#Performance Targets`, `prd.md#Risks & Mitigations`

---

## 2025-10-26: WebXR 360° Test Phase

**Status**: Approved

**Context**: After MVP completion, explore immersive VR capabilities to create 360° particle experience.

**Decision**: Create XR Test milestone to prototype WebXR-enabled immersive viewing mode.

**Approach**:
- Use Three.js built-in WebXRManager (no external dependencies)
- Convert from OrthographicCamera to PerspectiveCamera for VR
- Position camera at center (0, 0, 0) with particles in spherical space
- No interaction in test phase - just immersive observation
- Maintain backward compatibility with 2D mode
- Target 72fps+ for VR comfort

**Rationale**:
- WebXR support built into Three.js - low implementation cost
- 360° viewing enhances organic particle aesthetic
- Test feasibility before committing to full VR feature set
- Proof of concept can inform V1 VR architecture
- No controller interaction keeps scope manageable

**Consequences**:
- **Positive**: Immersive experience, tests VR feasibility, leverages existing particle system
- **Negative**: Requires VR hardware for testing, performance optimization needed for mobile VR

**References**: `milestones/xr-test/README.md`

---

## Future Decision Points

### Phase 2: Multi-Mode Architecture
**Status**: Not yet decided
**Context**: When adding multiple animation modes, need architecture for mode switching
**Options to explore**: State machine, strategy pattern, separate scene instances

### Phase 2: Audio-Reactive Integration
**Status**: Not yet decided
**Context**: If adding audio, need to decide on audio library and reactive patterns
**Options to explore**: Web Audio API, tone.js, reactive bindings

### XR Test: VR Interaction Model
**Status**: Not yet decided
**Context**: After XR Test, decide on interaction paradigm for full VR mode
**Options to explore**: Controller raycasting, hand tracking, gaze-based, gesture-based
