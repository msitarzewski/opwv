# 281028_vr-v1-planning

## Objective
Plan and document the VR Environments milestone (V1 release) with comprehensive task specifications, Mind's Eye aesthetic inspiration, Vision Pro spatial UI design, and complete architectural shift from 2D/VR hybrid to VR-only experience.

## Outcome
- ✅ Milestone directory created: `milestones/vr-environments/`
- ✅ 8 YAML task files created (862 lines total)
- ✅ README.md created with milestone overview
- ✅ Memory Bank updated (activeContext.md, progress.md)
- ✅ Architecture decisions documented

## Milestone Overview

**VR Environments (V1)**: 8 tasks, 18-22 hours estimated

### Vision
Transform OPWV into a VR-first meditative experience with multiple spatial environments inspired by 90's Mind's Eye, featuring Vision Pro-style spatial UI, user-controlled movement speed, and Apple-quality polish.

### Architectural Shift
- **Remove 2D mode entirely** - VR-only experience
- **Replace with HTML landing page** - For non-VR browsers
- **Vision Pro spatial UI** - Floating environment selector in VR
- **Mind's Eye aesthetic** - Psychedelic, abstract, mathematical, productivity-focused

## Files Created

### Milestone Structure
- `milestones/vr-environments/README.md` - Milestone overview and tracking
- `milestones/vr-environments/01-environment-architecture.yaml` (92 lines)
- `milestones/vr-environments/02-vr-only-migration.yaml` (73 lines)
- `milestones/vr-environments/03-spatial-ui-framework.yaml` (94 lines)
- `milestones/vr-environments/04-speed-control.yaml` (86 lines)
- `milestones/vr-environments/05-environment-presets.yaml` (126 lines)
- `milestones/vr-environments/06-landing-page.yaml` (107 lines)
- `milestones/vr-environments/07-environment-transitions.yaml` (120 lines)
- `milestones/vr-environments/08-testing-optimization.yaml` (164 lines)

**Total**: 862 lines of comprehensive task specifications

### Memory Bank Updates
- `memory-bank/activeContext.md` - Updated current phase, sprint focus, next steps
- `memory-bank/progress.md` - Added VR Environments milestone to upcoming
- `memory-bank/tasks/2025-10/281028_vr-v1-planning.md` - This file
- `memory-bank/tasks/2025-10/README.md` - Monthly summary update (pending)

## Task Breakdown

### VR-01: Environment System Architecture (2.5hr)
**Priority**: Critical | **Dependencies**: None

Create core architecture for environment management, configuration, and switching. Establishes foundation for multiple spatial environments.

**Deliverables**:
- `src/environments/Environment.js`
- `src/environments/EnvironmentManager.js`
- `src/environments/presets/` directory
- Environment configuration schema

### VR-02: VR-Only Migration (1.75hr)
**Priority**: Critical | **Dependencies**: None

Remove all 2D mode infrastructure. Remove OrthographicCamera, 2D particle initialization, 2D mouse interaction.

**Deliverables**:
- Updated `src/main.js` (VR-only)
- Updated `src/particles/ParticleSystem.js`
- Reduced bundle size
- Clean codebase

### VR-03: Spatial UI Framework (3.5hr)
**Priority**: Critical | **Dependencies**: VR-02

Build Vision Pro-style spatial UI for environment selection in VR. Floating 3D cards arranged in arc around user.

**Deliverables**:
- `src/ui/SpatialUI.js`
- `src/ui/EnvironmentCard.js`
- `src/ui/GazeController.js`
- `src/ui/ControllerInput.js`

### VR-04: Speed Control System (1.75hr)
**Priority**: High | **Dependencies**: VR-03

User-adjustable movement speed for productivity focus. Speed multiplier (0.25x - 2.0x), spatial UI controls, localStorage persistence.

**Deliverables**:
- `src/controls/SpeedControl.js`
- Speed slider UI component
- localStorage integration

### VR-05: Environment Presets (4.5hr)
**Priority**: Critical | **Dependencies**: VR-01

Create 5-7 unique spatial environments inspired by Mind's Eye aesthetic.

**Environments**:
1. **Sphere** - Spherical shell (baseline)
2. **Nebula** - Organic cloud formation
3. **Galaxy** - Spiral galaxy structure
4. **Lattice** - 3D geometric grid
5. **Vortex** - Swirling tornado/funnel
6. **Ocean** - Undulating wave plane (optional)
7. **Hypercube** - 4D tesseract projection (optional)

**Deliverables**:
- `src/environments/presets/sphere.js`
- `src/environments/presets/nebula.js`
- `src/environments/presets/galaxy.js`
- `src/environments/presets/lattice.js`
- `src/environments/presets/vortex.js`
- `src/environments/presets/ocean.js` (optional)
- `src/environments/presets/hypercube.js` (optional)

### VR-06: Landing Page (1.25hr)
**Priority**: Medium | **Dependencies**: None

Beautiful HTML landing page for non-VR browsers. VR requirement messaging, environment previews, browser/headset compatibility info.

**Deliverables**:
- `landing.html`
- `landing.css`
- Environment preview images
- Browser/headset icons

### VR-07: Environment Transitions (2.25hr)
**Priority**: High | **Dependencies**: VR-01, VR-05

Smooth transitions between environments with fade effects, particle morphing, loading state handling.

**Deliverables**:
- `src/transitions/TransitionManager.js`
- Fade to black effect
- Crossfade effect (optional)
- Particle morphing (optional)

### VR-08: Testing and Optimization (2.75hr)
**Priority**: Critical | **Dependencies**: All tasks

Comprehensive VR testing, performance profiling, comfort assessment, final optimization for V1 release.

**Deliverables**:
- `TESTING-V1.md`
- VR testing report (all environments)
- Performance profiling report
- User testing feedback summary
- Production readiness sign-off

## Patterns Applied

### AGENTS.md 2.1 Compliance
- ✅ Comprehensive acceptance criteria for each task
- ✅ Detailed task breakdowns (8-11 tasks per YAML)
- ✅ Technical specifications and notes
- ✅ Dependency mapping (clear task order)
- ✅ Reference documentation links
- ✅ Deliverable lists (specific files/artifacts)
- ✅ Estimated durations (18-22 hours total)

### Mind's Eye Aesthetic Research
Used WebSearch to research "Mind's Eye: A Computer Animation Odyssey" (1990):
- Psychedelic, abstract visual style
- Mathematical and geometric patterns
- Fluid motion, particle systems
- Meditative, hypnotic quality
- Vaporwave aesthetic meets sacred geometry

### Vision Pro Spatial UI Patterns
- Floating panels in 3D space
- Arc arrangement around user (3-4 units distance)
- Gaze-based selection (crosshair + 0.8s dwell)
- Controller raycasting support
- Glassmorphic cards with depth
- Smooth animations (fade, scale, position)

## Architectural Decisions

### Why VR-Only?
**Decision**: Remove 2D mode entirely, replace with HTML landing page

**Rationale**:
- User explicitly stated: "This is a VR only project. We can remove the 2D interface"
- Simplifies codebase (remove OrthographicCamera, 2D branching logic)
- Reduces bundle size (~2-3 kB)
- Clearer product focus (VR meditation experience)
- Better user experience (no mode confusion)

**Trade-offs**:
- Smaller addressable market (VR headset required)
- No desktop/mobile fallback experience
- Requires WebXR-capable browser + hardware

**Mitigations**:
- Beautiful landing page for non-VR browsers
- Clear messaging about VR requirement
- Browser/headset compatibility information

### Why Vision Pro Spatial UI?
**Decision**: Build floating 3D spatial UI in VR space (not 2D overlay)

**Rationale**:
- Immersive VR experience (not flat UI)
- Apple-quality design aesthetic
- Gaze and controller selection (VR-native)
- Spatially aware (cards in 3D arc)
- Follows Vision Pro design patterns (user request)

**Trade-offs**:
- More complex than 2D overlay UI
- Requires 3D layout math (arc formation)
- Performance considerations (UI + particles)

**Mitigations**:
- Canvas texture approach (best VR performance)
- Maintain 72fps with UI visible
- Simple, focused UI (environment selection only)

### Why Mind's Eye Aesthetic?
**Decision**: 90's psychedelic, abstract, mathematical visual style

**Rationale**:
- User explicitly requested: "Think like the 90's Mind's Eye"
- Productivity-focused (meditative, calming)
- Distinct visual identity (not generic particles)
- Rich environment variety (7 different spatial configs)
- Nostalgic, artistic appeal

**Implementation**:
- Nebula: Organic cloud (deep space colors)
- Galaxy: Spiral arms (logarithmic spiral math)
- Lattice: 3D geometric grid (sacred geometry)
- Vortex: Swirling funnel (fluid dynamics)
- Ocean: Undulating waves (sine wave propagation)
- Hypercube: 4D tesseract projection (abstract math)

### Why Speed Control?
**Decision**: User-adjustable movement speed (0.25x - 2.0x)

**Rationale**:
- User requested: "Productivity focused, user specified speed of movement"
- Focus state flexibility (slow = deep focus, fast = high energy)
- Productivity tool use case (ambient background while working)
- Personalization (user preference persistence)

**Implementation**:
- Speed multiplier affects delta time
- Spatial UI slider (VR-native control)
- localStorage persistence
- Preset buttons (0.5x, 1.0x, 1.5x, 2.0x)

## Technical Specifications

### Performance Targets
- **72fps minimum** (Quest 2/3 baseline)
- **1000 particles** per environment (adaptive quality)
- **Bundle: <600kB** (current: 476.64kB)
- **Transition time: <2s**
- **UI response: <100ms**

### Dependency Graph
```
VR-01 (Architecture) ────┬──→ VR-05 (Presets)
                         └──→ VR-07 (Transitions)

VR-02 (VR-Only) ────────────→ VR-03 (Spatial UI)

VR-03 (Spatial UI) ──────┬──→ VR-04 (Speed Control)
                         └──→ VR-05 (Presets - UI integration)

All tasks ──────────────────→ VR-08 (Testing)
```

### Environment Math References
- Logarithmic spiral: `r = a * e^(b*θ)`
- Gaussian distribution: `f(x) = (1/(σ√(2π))) * e^(-((x-μ)²/(2σ²)))`
- Tesseract projection: Standard 4D rotation matrices
- Sine wave: `y = A * sin(ωx + φ)`

## Integration Points

### Extends Existing Architecture
- `src/particles/ParticleSystem.js` - Accept environment config
- `src/particles/behaviors.js` - Behavior weight customization
- `src/utils/colors.js` - Environment-specific palettes
- `src/utils/noise.js` - 3D noise for spatial environments

### New Architecture Layers
- **Environment Management**: Environment class, EnvironmentManager
- **Spatial UI**: SpatialUI, EnvironmentCard, GazeController, ControllerInput
- **Speed Control**: SpeedControl class, spatial UI integration
- **Transitions**: TransitionManager, fade effects, particle morphing

## Testing Strategy

### VR Testing Requirements (VR-08)
- Meta Quest 2/3 testing (minimum)
- Desktop VR testing (optional)
- Performance profiling (Chrome DevTools)
- VR comfort assessment (motion sickness checklist)
- User testing with 3-5 VR users
- Cross-environment testing (all pairs)
- Speed control testing (all speeds)
- Spatial UI testing (gaze + controller)

### Documentation Deliverables
- `TESTING-V1.md` - Comprehensive VR testing guide
- VR testing report (all environments)
- Performance profiling report
- User testing feedback summary
- Bundle size optimization report
- Production readiness sign-off

## Next Steps

1. ✅ Milestone planning complete (8 YAML files created)
2. ✅ Memory Bank updated (activeContext.md, progress.md)
3. ⏳ Begin VR-01 (Environment System Architecture) - awaiting user direction
4. Sequential implementation following dependency graph
5. Regular VR testing checkpoints
6. User testing before VR-08 completion

## References
- Mind's Eye (1990) - https://archive.org/details/mindseyevhs
- Vision Pro Design Guidelines - Apple spatial UI patterns
- WebXR Device API - https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API
- XR Test Milestone - `milestones/xr-test/` (prior VR implementation)
- AGENTS.md 2.1 - Task specification patterns
- systemPatterns.md - Architecture patterns

## Artifacts
- Milestone directory: `milestones/vr-environments/`
- 8 YAML task files (862 lines total)
- README.md (milestone overview)
- Memory Bank updates (activeContext.md, progress.md)
- This task documentation (281028_vr-v1-planning.md)
